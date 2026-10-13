import { backupRecords, recordsFromBackup, defaultLearnerFields, mergeLearnerMutation, type LearnerMutation, type LearnerRecord } from "../../packages/roadmap-schema/src/index";
import { demoAccountKey, readDemoBackup, writeDemoBackup } from "./demo-account";
import { recordKey, type Records } from "./study-model";
import type { Transport, Snapshot } from "./sync";

export function cachedLibraryRows(snapshots: Snapshot[], accountId: string) {
  return snapshots.filter(snapshot => snapshot.accountId === accountId).map(({ package: value }) => ({ roadmap_id: value.roadmap.roadmapId, title: value.roadmap.title, subject: value.roadmap.subject ?? null, level: value.roadmap.level ?? null, goals: value.roadmap.goals, active_revision_id: value.content.revisionId, active_schedule_id: value.schedules[0].scheduleId, archived_at: null, updated_at: "" }));
}

export const learnerTables = ["roadmap_task_progress", "roadmap_task_notes", "roadmap_topic_mastery", "roadmap_study_time", "roadmap_milestone_evidence", "roadmap_assignment_moves"];
export async function cloudRecords(select: (table: string) => Promise<Record<string, unknown>[]>): Promise<Records> {
  const results = await Promise.all(learnerTables.map(select));
  const records: Records = {};
  results.forEach((rows, index) => rows.forEach(row => {
    const kinds = ["completion", "note", "mastery", "study-time", "milestone", "assignment"];
    const ids = ["task_id", "task_id", "topic_id", "entry_id", "milestone_id", "assignment_id"];
    const kind = kinds[index];
    const data: LearnerRecord["data"] = kind === "completion" ? { state: String(row.state), completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null }
      : kind === "note" ? { text: String(row.text) }
      : kind === "study-time" ? { taskId: String(row.task_id), minutes: Number(row.minutes), recordedAt: new Date(String(row.recorded_at)).toISOString() }
      : kind === "assignment" ? { scheduleId: String(row.schedule_id), date: String(row.date), overrideReason: String(row.override_reason) }
      : { state: String(row.state), evidence: String(row.evidence) };
    records[recordKey(kind, String(row[ids[index]]))] = { revision: Number(row.revision ?? row.server_revision), data };
  }));
  return records;
}

export function demoTransport(roadmap: string): Transport {
  const key = `semassist-study-demo-server:${roadmap}`;
  const read = () => {
    if (localStorage.getItem(demoAccountKey)) {
      const item = readDemoBackup().roadmaps.find(r => r.roadmapId === roadmap);
      if (!item) throw new Error("Roadmap was removed; export any queued edits before closing");
      return { records: recordsFromBackup(item), receipts: JSON.parse(localStorage.getItem(demoAccountKey)!).receipts ?? {} };
    }
    return JSON.parse(localStorage.getItem(key) ?? '{"records":{},"receipts":{}}') as { records: Records; receipts: Record<string, { mutation: LearnerMutation; result: Awaited<ReturnType<Transport["send"]>> }> };
  };
  return {
    async read() { return read().records; },
    async send(mutation) {
      if (mutation.accountId !== "demo" || mutation.roadmapId !== roadmap) throw new Error("Demo ownership mismatch");
      const server = read();
      const receipt = server.receipts[mutation.mutationId];
      if (receipt) { if (JSON.stringify(receipt.mutation) !== JSON.stringify(mutation)) throw new Error("Mutation ID was reused with different data"); return receipt.result; }
      const id = recordKey(mutation.payload.kind, mutation.entityId);
      const result = mergeLearnerMutation(server.records[id] ?? { revision: 0, data: defaultLearnerFields(mutation.payload.kind) }, mutation);
      if (result.status === "acknowledged") server.records[id] = result.record;
      server.receipts[mutation.mutationId] = { mutation, result };
      if (localStorage.getItem(demoAccountKey)) {
        const backup = readDemoBackup(), item = backup.roadmaps.find(r => r.roadmapId === roadmap)!;
        item.records = backupRecords(server.records);
        if (result.status === "acknowledged") item.learnerRevision++;
        writeDemoBackup(backup, server.receipts);
      } else localStorage.setItem(key, JSON.stringify(server));
      return result;
    },
  };
}

export function downloadRecovery(value: unknown, filename = "semassist-study-recovery.json") {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: value }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
