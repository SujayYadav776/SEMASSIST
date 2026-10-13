import { defaultLearnerFields, learnerMutationSchema, type LearnerMutation, type LearnerKind, type LearnerRecord, type RoadmapPackage } from "../../packages/roadmap-schema/src/index";
import { recordKey, type Records } from "./study-model";

export type Pending = { mutation: LearnerMutation; status: "pending" | "conflict" | "error"; error?: string; remote?: LearnerRecord };
export type Snapshot = { accountId: string; roadmapId: string; package: RoadmapPackage; records: Records; outbox: Pending[] };
export type Store = { read(account: string, roadmap: string): Promise<Snapshot | undefined>; write(value: Snapshot): Promise<void>; list(account: string): Promise<Snapshot[]>; clear(account: string): Promise<void> };
export type Transport = { read(): Promise<Records>; send(mutation: LearnerMutation): Promise<{ status: "acknowledged" | "conflict"; record: LearnerRecord }> };
const storageKey = (account: string, roadmap: string) => `${account}:${roadmap}`;

export function indexedStore(): Store {
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("semassist-roadmap-study-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("snapshots", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB is unavailable"));
    request.onblocked = () => reject(new Error("Close other SEM ASSIST tabs to unlock the cache"));
  });
  async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("snapshots", mode);
      const request = action(transaction.objectStore("snapshots"));
      transaction.oncomplete = () => { db.close(); resolve(request.result); };
      transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Cache transaction failed")); };
    });
  }
  const fallback = (account: string, roadmap: string) => `semassist-study-recovery:${storageKey(account, roadmap)}`;
  return {
    async read(account, roadmap) {
      const recovery = localStorage.getItem(fallback(account, roadmap));
      const value = recovery ? JSON.parse(recovery) as Snapshot : await run("readonly", store => store.get(storageKey(account, roadmap))) as Snapshot | undefined;
      if (value && (value.accountId !== account || value.roadmapId !== roadmap)) throw new Error("Cache ownership mismatch");
      return value;
    },
    async write(value) {
      try { await run("readwrite", store => store.put({ ...value, key: storageKey(value.accountId, value.roadmapId) })); localStorage.removeItem(fallback(value.accountId, value.roadmapId)); }
      catch (error) { try { localStorage.setItem(fallback(value.accountId, value.roadmapId), JSON.stringify(value)); } catch { /* In-memory export remains available when both stores fail. */ } throw error; }
    },
    async list(account) {
      const values = await run("readonly", store => store.getAll()) as Snapshot[];
      const own = new Map(values.filter(v => v.accountId === account).map(v => [v.roadmapId, v]));
      for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i)!; if (key.startsWith(`semassist-study-recovery:${account}:`)) { const v = JSON.parse(localStorage.getItem(key)!) as Snapshot; if (v.accountId === account) own.set(v.roadmapId, v); } }
      return [...own.values()];
    },
    async clear(account) {
      const values = await this.list(account);
      for (const value of values) { await run("readwrite", store => store.delete(storageKey(account, value.roadmapId))); localStorage.removeItem(fallback(account, value.roadmapId)); }
    },
  };
}

export function optimisticRecords(snapshot: Snapshot): Records {
  const records = structuredClone(snapshot.records);
  for (const { mutation } of snapshot.outbox) {
    const key = recordKey(mutation.payload.kind, mutation.entityId);
    const previous = records[key] ?? { revision: 0, data: defaultLearnerFields(mutation.payload.kind) };
    records[key] = { revision: previous.revision, data: { ...previous.data, ...mutation.payload.changes } };
  }
  return records;
}

export class StudySync {
  error = "";
  saving = false;
  syncing = false;
  private gate: Promise<unknown> = Promise.resolve();
  private stopped = false;
  constructor(public snapshot: Snapshot, private store: Store, private transport: Transport, private changed: () => void, private online = () => navigator.onLine) {}
  stop() { this.stopped = true; }
  async updatePackage(value: RoadmapPackage) {
    if (value.roadmap.roadmapId !== this.snapshot.roadmapId) throw new Error("Roadmap ownership mismatch");
    await this.edit(() => { this.snapshot.package = value; });
  }
  private edit(action: () => void) {
    const work = this.gate.then(async () => {
      if (this.stopped) return;
      action(); this.saving = true; this.changed();
      try { await this.store.write(this.snapshot); this.error = ""; }
      catch (error) { this.error = `Cache failed: ${error instanceof Error ? error.message : "storage unavailable"}. Export a recovery copy before closing.`; }
      finally { this.saving = false; this.changed(); }
    });
    this.gate = work.catch(() => {}); return work;
  }
  async enqueue(kind: LearnerKind, entityId: string, changes: LearnerMutation["payload"]["changes"], draftBaseline?: LearnerRecord) {
    await this.edit(() => {
      const previous = draftBaseline ?? optimisticRecords(this.snapshot)[recordKey(kind, entityId)] ?? { revision: 0, data: defaultLearnerFields(kind) };
      const mutation = learnerMutationSchema.parse({ mutationId: crypto.randomUUID(), accountId: this.snapshot.accountId, roadmapId: this.snapshot.roadmapId, entityId, baselineRevision: previous.revision, base: previous.data, payload: { kind, changes } });
      this.snapshot.outbox.push({ mutation, status: "pending" });
    });
    void this.flush();
  }
  async flush() {
    if (this.syncing || this.stopped || !this.online()) return;
    this.syncing = true; this.changed();
    try {
      await this.gate;
      while (this.snapshot.outbox.length && !this.stopped && this.online()) {
        const head = this.snapshot.outbox[0]; if (head.status === "conflict") break;
        try {
          const result = await this.transport.send(head.mutation);
          if (this.stopped) break;
          await this.edit(() => {
            const key = recordKey(head.mutation.payload.kind, head.mutation.entityId);
            this.snapshot.records[key] = result.record;
            if (result.status === "acknowledged") this.snapshot.outbox = this.snapshot.outbox.filter(v => v.mutation.mutationId !== head.mutation.mutationId);
            else { head.status = "conflict"; head.remote = result.record; }
          });
          if (result.status === "conflict") break;
        } catch (error) {
          await this.edit(() => { head.status = "error"; head.error = error instanceof Error ? error.message : "Connection failed"; });
          break;
        }
      }
      if (!this.stopped && this.online()) {
        const records = await this.transport.read();
        await this.edit(() => { this.snapshot.records = records; });
      }
    } catch (error) { this.error = error instanceof Error ? error.message : "Refresh failed"; }
    finally { this.syncing = false; this.changed(); }
  }
  async resolve(id: string, keepLocal: boolean, noteText?: string) {
    await this.edit(() => {
      const pending = this.snapshot.outbox.find(v => v.mutation.mutationId === id); if (!pending?.remote) return;
      const old = pending.mutation;
      // Later edits based on this field need an explicit choice too, never a silent rebase.
      this.snapshot.outbox.forEach(v => { if (v !== pending && v.mutation.entityId === old.entityId && v.mutation.payload.kind === old.payload.kind) { v.status = "conflict"; v.remote = pending.remote; } });
      if (keepLocal) {
        const changes = noteText !== undefined && old.payload.kind === "note" ? { text: noteText } : old.payload.changes;
        pending.mutation = learnerMutationSchema.parse({ ...old, mutationId: crypto.randomUUID(), baselineRevision: pending.remote.revision, base: pending.remote.data, payload: { kind: old.payload.kind, changes } });
        pending.status = "pending"; pending.remote = undefined;
      } else this.snapshot.outbox = this.snapshot.outbox.filter(v => v !== pending);
    });
    void this.flush();
  }
  status() {
    if (this.error) return "error";
    if (this.snapshot.outbox.some(v => v.status === "conflict")) return "conflict";
    if (!this.online()) return "offline";
    if (this.snapshot.outbox.some(v => v.status === "error")) return "error";
    return this.snapshot.outbox.length || this.saving || this.syncing ? "pending" : "synced";
  }
}
