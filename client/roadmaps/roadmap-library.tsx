import { useEffect, useMemo, useState, useRef } from "react";
import { validatePackage, validateBackup, scheduleSchema, savedScheduleCandidate, activePackage, replanSnapshot, assertReplanBaseline, carryoverRecords, backupRecords, recordsFromBackup, type AccountBackup, type BackupRoadmap, type MappingDecision, type RoadmapPackage } from "../../packages/roadmap-schema/src/index";
import fixture from "../../examples/beginner-python.json";
import { compareItems, workloadSummary, type Change } from "./diff";
import { StudyWorkspace } from "./study-workspace";
import { cloudRecords, demoTransport, downloadRecovery, cachedLibraryRows } from "./study-storage";
import { indexedStore } from "./sync";
import { demoKey, demoRows, readDemoBackup, writeDemoBackup } from "./demo-account";
import { addDays, assignedDate } from "./study-model";

type RoadmapRow = {
  roadmap_id: string;
  title: string;
  subject: string | null;
  level: string | null;
  goals: string[];
  active_revision_id: string | null;
  active_schedule_id: string | null;
  archived_at: string | null;
  updated_at: string;
};

type Preview = { roadmap: RoadmapPackage; warnings: { path: string; message: string }[]; added: number; removed: number; topics: Change[]; tasks: Change[]; previousWorkload?: ReturnType<typeof workloadSummary>; nextWorkload: ReturnType<typeof workloadSummary> };
type User = { id: string; email?: string };
const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
const supabase = createClient(window.SUPABASE_CONFIG?.url ?? "https://invalid.local", window.SUPABASE_CONFIG?.anonKey ?? "missing", { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

function readDemo(): RoadmapRow[] {
  return demoRows();
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function newIdentity(value: RoadmapPackage): RoadmapPackage {
  const ids = new Map<string, string>();
  const replace = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(replace);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, replace(child)]));
    if (typeof item === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item)) {
      if (!ids.has(item)) ids.set(item, crypto.randomUUID());
      return ids.get(item);
    }
    return item;
  };
  const copy = replace(value) as RoadmapPackage;
  copy.importKind = "new";
  copy.generatedAt = new Date().toISOString();
  copy.content.predecessorRevisionId = undefined;
  copy.baseline = undefined;
  copy.mappings = [];
  copy.roadmap.title = `${copy.roadmap.title} (copy)`;
  copy.generator.assumptions.push("Fresh copy restarts every task. Review added assignments and visible overrides before import.");
  for (const schedule of copy.schedules) {
    schedule.durationSemantics = "total";
    let firstDay = schedule.startDate;
    while (!schedule.studyDays.includes(((new Date(`${firstDay}T00:00:00Z`).getUTCDay() + 6) % 7) + 1)) firstDay = addDays(firstDay, 1);
    const reason = "Fresh copy restarts completed prerequisites; review this date before importing.";
    const scheduled = new Set(schedule.assignments.map(a => a.taskId));
    for (const task of copy.content.tasks.filter(t => t.required && !scheduled.has(t.taskId))) schedule.assignments.push({ assignmentId: crypto.randomUUID(), taskId: task.taskId, date: firstDay, overrideReason: reason });
    schedule.assignments.forEach(a => { a.overrideReason ??= reason; });
    const days = new Map<string, number>();
    for (const assignment of schedule.assignments) { const date = assignedDate(schedule, assignment, {}); days.set(date, (days.get(date) ?? 0) + copy.content.tasks.find(t => t.taskId === assignment.taskId)!.minutes); }
    for (const [date, minutes] of days) if (minutes > schedule.dailyCapacityMinutes && !schedule.workloadOverrides.some(o => o.date === date)) schedule.workloadOverrides.push({ date, reason: "Fresh copy restores all required tasks; review workload or replan before studying." });
  }
  return copy;
}

function download(value: unknown, filename = "semassist-backup.json") {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function RoadmapLibrary() {
  const demo = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname) && new URLSearchParams(location.search).get("demo") === "1";
  const [user, setUser] = useState<User | null>(null);
  const currentAccount = useRef(demo ? "demo" : "signed-out");
  currentAccount.current = demo ? "demo" : user?.id ?? "signed-out";
  const [rows, setRows] = useState<RoadmapRow[]>(demo ? readDemo() : []);
  const [showArchived, setShowArchived] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [decisions, setDecisions] = useState<MappingDecision[]>([]);
  const [restorePreview, setRestorePreview] = useState<{ backup: AccountBackup; expected: AccountBackup; restoreId: string } | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [planTools, setPlanTools] = useState<BackupRoadmap | null>(null);
  const [target, setTarget] = useState<RoadmapPackage["schedules"][number] | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [activation, setActivation] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeRoadmap, setActiveRoadmap] = useState(() => new URLSearchParams(location.search).get("roadmap") ?? location.hash.match(/^#\/study\/([^/]+)/)?.[1] ?? "");
  const [studyOpen, setStudyOpen] = useState(() => !!new URLSearchParams(location.search).get("roadmap") || location.hash.startsWith("#/study/"));
  const visibleRows = useMemo(() => rows.filter(row => (showArchived || !row.archived_at) && `${row.title} ${row.subject ?? ""} ${row.level ?? ""} ${row.goals?.join(" ") ?? ""}`.toLowerCase().includes(search.toLowerCase())), [rows, showArchived, search]);

  useEffect(() => {
    if (demo) return;
    let active = true;
    const applyUser = (next: User | null) => { if (!active) return; if ((next?.id ?? "signed-out") !== currentAccount.current) { setRows([]); setPreview(null); setRestorePreview(null); setPlanTools(null); setMessage(""); setDecisions([]); } setUser(next); };
    void supabase.auth.getSession().then(({ data }: { data: { session: { user: User } | null } }) => applyUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
      setTimeout(() => applyUser(session?.user ?? null), 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [demo]);

  useEffect(() => {
    const direct = new URLSearchParams(location.search).get("roadmap") ?? location.hash.match(/^#\/study\/([^/]+)/)?.[1];
    setActiveRoadmap(direct ?? localStorage.getItem(`${demoKey}:${demo ? "demo" : user?.id ?? "signed-out"}:active`) ?? "");
  }, [demo, user?.id]);

  async function refresh() {
    if (demo) { setRows(readDemo()); return; }
    if (!user) { setRows([]); return; }
    const { data, error } = await supabase.from("roadmaps").select("roadmap_id,title,subject,level,goals,active_revision_id,active_schedule_id,archived_at,updated_at").order("updated_at", { ascending: false });
    if (currentAccount.current !== user.id) return;
    if (error) {
      const cached = await indexedStore().list(user.id);
      if (!cached.length) throw error;
      if (currentAccount.current !== user.id) return;
      setRows(cachedLibraryRows(cached, user.id));
      setMessage("Showing previously opened plans from this account's cache. Reconnect to refresh the library.");
      return;
    }
    setRows((data ?? []) as RoadmapRow[]);
  }

  useEffect(() => { void refresh().catch(error => setMessage(errorText(error))); }, [user, demo]);

  async function authenticate(kind: "signInWithPassword" | "signUp") {
    setBusy(true); setMessage("");
    const result = kind === "signUp"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(result.error ? result.error.message : kind === "signUp" ? "Account created. Check your email to confirm it." : "Signed in.");
    if (result.data.user && result.data.session) setUser(result.data.user);
  }

  async function previewFile(file?: File) {
    if (!file) return;
    if (!navigator.onLine) { setMessage("Reconnect before importing a roadmap."); return; }
    const owner = currentAccount.current;
    setMessage(""); setDecisions([]);
    if (file.size > 5 * 1024 * 1024) { setPreview(null); setMessage("Choose a JSON file no larger than 5 MiB."); return; }
    const raw = await file.text();
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setPreview(null); setMessage("This file is not valid JSON."); return; }
    const result = validatePackage(parsed);
    if (!result.success) { setPreview(null); setMessage(result.errors.map(issue => `${issue.path}: ${issue.message}`).join("\n")); return; }
    const previousRow = rows.find(row => row.roadmap_id === result.data.roadmap.roadmapId);
    let previous: RoadmapPackage | undefined;
    try { previous = previousRow && result.data.importKind !== "new" ? await getPackage(previousRow) : undefined; }
    catch (error) { setPreview(null); setMessage(errorText(error)); return; }
    if (currentAccount.current !== owner) return;
    const oldTasks = new Set(previous?.content.tasks.map(task => task.taskId) ?? result.data.baseline?.taskIds ?? []);
    const nextTasks = new Set(result.data.content.tasks.map(task => task.taskId));
    setPreview({ roadmap: result.data, warnings: result.warnings, added: [...nextTasks].filter(id => !oldTasks.has(id)).length, removed: [...oldTasks].filter(id => !nextTasks.has(id)).length, topics: compareItems(previous?.content.topics ?? [], result.data.content.topics), tasks: compareItems(previous?.content.tasks ?? [], result.data.content.tasks), previousWorkload: previous ? workloadSummary(previous) : undefined, nextWorkload: workloadSummary(result.data) });
  }

  async function commitImport(value = preview?.roadmap) {
    if (!value) return;
    if (!navigator.onLine) { setMessage("Reconnect before importing a roadmap."); return; }
    try { await accountBackup(); } catch (error) { setMessage(errorText(error)); return; }
    if (value.mappings.some(m => !decisions.some(d => d.mappingId === m.mappingId))) { setMessage("Choose carryover for every mapping before importing."); return; }
    if (!window.confirm(`Import “${value.roadmap.title}” with ${value.content.tasks.length} tasks? The first schedule becomes active; existing schedules and original notes remain in history.`)) return;
    setBusy(true); setMessage("");
    try {
      if (demo) {
        const backup = readDemoBackup(), prior = backup.roadmaps.find(r => r.roadmapId === value.roadmap.roadmapId);
        if (value.importKind === "new" && prior) throw new Error("Roadmap already exists; use a revision or duplicate");
        if (value.importKind !== "new" && !prior) throw new Error("Roadmap baseline not found");
        if (prior) assertReplanBaseline(prior, value, decisions);
        const item: BackupRoadmap = prior ?? { roadmapId: value.roadmap.roadmapId, activeRevisionId: value.content.revisionId, activeScheduleId: value.schedules[0].scheduleId, archivedAt: null, learnerRevision: 0, packages: [], schedules: [], records: [] };
        item.packages.push(value); item.activeRevisionId = value.content.revisionId; item.activeScheduleId = value.schedules[0].scheduleId;
        item.records = backupRecords(carryoverRecords(recordsFromBackup(item), value, decisions));
        if (decisions.some(d => d.carryover !== "none")) item.learnerRevision++;
        if (!prior) backup.roadmaps.push(item);
        writeDemoBackup(backup); setRows(readDemo());
      } else {
        const requestKey = `semassist-import:${accountId}`;
        const old = JSON.parse(localStorage.getItem(requestKey) ?? "null");
        const body = old && JSON.stringify(old.package) === JSON.stringify(value) && JSON.stringify(old.decisions) === JSON.stringify(decisions) ? old : { package: value, decisions, importId: crypto.randomUUID() };
        localStorage.setItem(requestKey, JSON.stringify(body));
        await accountRequest(body, "roadmap-import");
        localStorage.removeItem(requestKey);
        await refresh();
      }
      setPreview(null); setMessage("Roadmap saved.");
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }

  async function getPackage(row: RoadmapRow): Promise<RoadmapPackage> {
    if (demo) {
      const stored = readDemoBackup().roadmaps.find(r => r.roadmapId === row.roadmap_id);
      if (stored) return activePackage(stored);
      throw new Error("This demo package is missing. Import a package to recover it.");
    }
    const current = await supabase.from("roadmaps").select("active_revision_id,active_schedule_id").eq("roadmap_id", row.roadmap_id).single();
    if (current.error) throw current.error;
    row = { ...row, ...current.data };
    const [revision, schedule] = await Promise.all([
      supabase.from("roadmap_revisions").select("package_json").eq("roadmap_id", row.roadmap_id).eq("revision_id", row.active_revision_id).single(),
      supabase.from("roadmap_schedules").select("package_json").eq("roadmap_id", row.roadmap_id).eq("revision_id", row.active_revision_id),
    ]);
    if (revision.error) throw revision.error;
    if (schedule.error) throw schedule.error;
    const value = revision.data.package_json as RoadmapPackage;
    const schedules = (schedule.data ?? []).map((item: { package_json: RoadmapPackage["schedules"][number] }) => item.package_json);
    schedules.sort((a: RoadmapPackage["schedules"][number], b: RoadmapPackage["schedules"][number]) => Number(b.scheduleId === row.active_schedule_id) - Number(a.scheduleId === row.active_schedule_id));
    return { ...value, schedules, importKind: "new", baseline: undefined, mappings: [] };
  }

  const accountId = demo ? "demo" : user?.id ?? "signed-out";
  async function accountRequest(body: unknown, functionName = "roadmap-account") {
    if (!navigator.onLine) throw new Error("Reconnect before backing up, restoring, or activating schedules");
    const owner = accountId;
    const { data: session } = await supabase.auth.getSession();
    if (session.session?.user.id !== owner || currentAccount.current !== owner) throw new Error("Account changed; reopen this preview");
    const { data, error } = await supabase.functions.invoke(functionName, { body, headers: { Authorization: `Bearer ${session.session.access_token}` } });
    if (currentAccount.current !== owner) throw new Error("Account changed; reopen this preview");
    if (error) throw error;
    if (!data || !("result" in data)) throw new Error(data?.error ?? "Account operation was not acknowledged");
    return data.result;
  }
  async function accountBackup() {
    if (currentAccount.current !== accountId) throw new Error("Account changed; reopen this preview");
    if (!navigator.onLine) throw new Error("Reconnect to export an authoritative backup");
    const cached = await indexedStore().list(accountId);
    if (cached.some(s => s.outbox.length)) throw new Error("Sync or resolve queued edits first; Settings offers a separate pending-work recovery export");
    if (navigator.locks) {
      const locks = await navigator.locks.query();
      if (locks.held?.some(l => l.name?.startsWith(`semassist-study:${accountId}:`))) throw new Error("Close this account's open study tabs before taking an account snapshot");
    }
    const backup = validateBackup(demo ? readDemoBackup() : await accountRequest({ action: "backup" }));
    if (currentAccount.current !== accountId) throw new Error("Account changed; reopen this preview");
    return backup;
  }
  async function exportAccount() { try { download(await accountBackup()); setMessage("Account backup downloaded. It includes private notes; keep it somewhere safe."); } catch (error) { setMessage(errorText(error)); } }
  async function previewRestore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("Backup exceeds 25 MiB");
      const backup = validateBackup(JSON.parse(await file.text()));
      setRestorePreview({ backup, expected: await accountBackup(), restoreId: crypto.randomUUID() }); setRestoreMode("merge"); setPlanTools(null);
    } catch (error) { setRestorePreview(null); setMessage(errorText(error)); }
  }
  async function restoreAccount() {
    if (!restorePreview) return;
    setBusy(true);
    try {
      const current = await accountBackup();
      if (demo && (current.sourceAccount !== restorePreview.expected.sourceAccount || JSON.stringify(current.roadmaps) !== JSON.stringify(restorePreview.expected.roadmaps))) throw new Error("Account changed since preview. Select the backup again.");
      download(restorePreview.expected, "semassist-before-restore.json");
      if (!window.confirm(`Restore into ${accountId === "demo" ? "the local demo" : user?.email}? ${restoreMode === "replace" ? "All existing roadmaps will be replaced." : "Existing roadmap IDs will be kept; only missing roadmaps are added."} A recovery backup has been downloaded.`)) return;
      if (demo) {
        const incoming = structuredClone(restorePreview.backup);
        const originalIds = new Set(current.roadmaps.map(r => r.roadmapId));
        const next = restoreMode === "replace" ? incoming : { ...current, roadmaps: [...current.roadmaps, ...incoming.roadmaps.filter(r => !originalIds.has(r.roadmapId))] };
        next.roadmaps.forEach(item => { if (restoreMode === "replace" || !originalIds.has(item.roadmapId)) {
          item.learnerRevision = Math.max(item.learnerRevision, current.roadmaps.find(r => r.roadmapId === item.roadmapId)?.learnerRevision ?? 0) + item.records.length + 1;
          item.records.forEach(r => { r.revision = item.learnerRevision; });
        } });
        writeDemoBackup(next);
      } else {
        const result = await accountRequest({ action: "restore", restoreId: restorePreview.restoreId, backup: restorePreview.backup, expected: restorePreview.expected, mode: restoreMode });
        if (result.previousBackup) download(result.previousBackup, "semassist-server-before-restore.json");
      }
      await indexedStore().clear(accountId); await refresh(); setRestorePreview(null); setPlanTools(null); setMessage("Backup restored. Existing study views will reload the restored records.");
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  }
  async function openPlanTools(row: RoadmapRow) {
    try { const item = (await accountBackup()).roadmaps.find(r => r.roadmapId === row.roadmap_id)!; setPlanTools(item); setTarget({ ...activePackage(item).schedules[0] }); setActivation(""); setIncludeNotes(false); } catch (error) { setMessage(errorText(error)); }
  }
  async function exportReplan() {
    if (!planTools || !target) return;
    try {
      if (!Number.isInteger(target.length) || target.length < 1 || target.length > 3660 || !Number.isInteger(target.dailyCapacityMinutes) || target.dailyCapacityMinutes < 1 || target.dailyCapacityMinutes > 1440 || !/^\d{4}-\d{2}-\d{2}$/.test(target.startDate)) throw new Error("Choose a valid date, 1–3660 days, and 1–1440 minutes");
      scheduleSchema.parse(target); new Intl.DateTimeFormat("en", { timeZone: target.timezone }); const item = (await accountBackup()).roadmaps.find(r => r.roadmapId === planTools.roadmapId)!;
      download(replanSnapshot(item, target, includeNotes), "semassist-replan.json"); setMessage("Replanning snapshot downloaded. Give it to the semassist skill, then preview the returned JSON here.");
    } catch (error) { setMessage(errorText(error)); }
  }
  async function activateSchedule() {
    if (!planTools || !activation) return;
    try {
      const expected = replanSnapshot(planTools, activePackage(planTools).schedules[0]).baseline;
      const current = (await accountBackup()).roadmaps.find(r => r.roadmapId === planTools.roadmapId)!;
      const baseline = replanSnapshot(current, activePackage(current).schedules[0]).baseline;
      if (JSON.stringify(expected) !== JSON.stringify(baseline)) throw new Error("Progress or schedule changed; reopen the schedule preview");
      if (!window.confirm("Activate this schedule? Task completion stays shared, and the current schedule stays in history.")) return;
      if (demo) { const backup = readDemoBackup(); backup.roadmaps.find(r => r.roadmapId === planTools.roadmapId)!.activeScheduleId = activation; writeDemoBackup(backup); }
      else await accountRequest({ action: "activate", roadmapId: planTools.roadmapId, scheduleId: activation, expected: { revisionId: expected.revisionId, scheduleId: expected.scheduleId, learnerRevision: expected.learnerRevision } });
      await refresh(); setPlanTools(null); setMessage("Schedule activated.");
    } catch (error) { setMessage(errorText(error)); }
  }
  useEffect(() => {
    if (accountId === "signed-out") return;
    const prepare = async () => {
      try {
        if (navigator.locks) {
          const locks = await navigator.locks.query();
          if (!locks.held) throw new Error("Could not verify open study tabs; retry before signing out");
          if (locks.held.filter(lock => lock.name?.startsWith(`semassist-study:${accountId}:`)).length > (window.semassistStudy ? 1 : 0)) {
            throw new Error("Close this account's other study tabs before clearing its cache or signing out");
          }
        }
        const snapshots = await indexedStore().list(accountId);
        if (snapshots.some(s => s.outbox.length) || window.semassistStudy?.pending()) {
          downloadRecovery(snapshots); window.semassistStudy?.export();
          if (!window.confirm("A recovery copy was downloaded. Sign out and discard this account's pending cache?")) return false;
        }
        window.semassistStudy?.stop();
        await indexedStore().clear(accountId); return true;
      } catch (error) { window.semassistStudy?.export(); setMessage(`Could not prepare sign-out: ${errorText(error)}. Resolve the cache error or export your edits first.`); return false; }
    };
    window.semassistPrepareSignOut = prepare;
    return () => { delete window.semassistPrepareSignOut; };
  }, [accountId, activeRoadmap]);
  function openStudy(id: string) {
    localStorage.setItem(`${demoKey}:${accountId}:active`, id);
    setActiveRoadmap(id); setStudyOpen(true);
    history.replaceState(null, "", `#/study/${id}/overview`);
    parent.postMessage({ type: "semassist-roadmaps-route", roadmap: id, view: "overview", task: "" }, location.origin);
  }
  function closeStudy() {
    setStudyOpen(false);
    history.replaceState(null, "", location.pathname + location.search.replace(/([?&])(roadmap|view|task)=[^&]*/g, "$1"));
    parent.postMessage({ type: "semassist-roadmaps-route", roadmap: "", view: "", task: "" }, location.origin);
  }
  async function signOutSafely() {
    try {
      if (!(await window.semassistPrepareSignOut?.())) return;
      if (demo) { closeStudy(); return; }
      const { error } = await supabase.auth.signOut(); if (error) throw error;
    } catch (error) { setMessage(errorText(error)); }
  }

  const studyRow = rows.find(row => row.roadmap_id === activeRoadmap);
  if ((demo || user) && studyOpen && studyRow) return <main className="shell"><StudyWorkspace key={`${accountId}:${studyRow.roadmap_id}`} accountId={accountId} roadmapId={studyRow.roadmap_id} choices={rows.map(row => ({ id: row.roadmap_id, title: row.title }))} loadPackage={() => getPackage(studyRow)} transport={demo ? demoTransport(studyRow.roadmap_id) : {
    read: () => cloudRecords(async table => { const { data, error } = await supabase.from(table).select("*").eq("owner_id", accountId).eq("roadmap_id", studyRow.roadmap_id); if (error) throw new Error(error.message); return data ?? []; }),
    send: async mutation => { const { data: session } = await supabase.auth.getSession(); if (session.session?.user.id !== accountId) throw new Error("Account changed; this queue belongs to the previous account."); const { data, error } = await supabase.functions.invoke("roadmap-mutate", { body: { mutation }, headers: { Authorization: `Bearer ${session.session.access_token}` } }); if (error) throw new Error(error.message); if (!data?.result) throw new Error(data?.error ?? "No mutation acknowledgement received"); return data.result; },
  }} onChoose={openStudy} onBack={closeStudy} onSignOut={signOutSafely} />{message && <p className="notice" role="alert">{message}</p>}</main>;

  async function act(row: RoadmapRow, action: "archive" | "restore" | "delete" | "duplicate" | "export") {
    setMessage("");
    try {
      if (action === "export" || action === "duplicate") {
        const value = await getPackage(row);
        if (action === "export") {
          const item = (await accountBackup()).roadmaps.find(r => r.roadmapId === row.roadmap_id)!;
          const definition = item.packages.find(p => p.content.revisionId === item.activeRevisionId)!;
          download(definition, `${value.roadmap.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`);
          setMessage("Definition package exported. Use account backup for all saved schedules and learner records.");
        } else await previewFile(new File([JSON.stringify(newIdentity(value))], "roadmap-copy.json", { type: "application/json" }));
        return;
      }
      const recovery = await accountBackup();
      if (action === "delete" && !window.confirm(`Permanently delete “${row.title}” and its roadmap data? This cannot be undone.`)) return;
      if (action === "delete") download(recovery, "semassist-before-delete.json");
      if (demo) {
        const backup = readDemoBackup();
        if (action === "delete") backup.roadmaps = backup.roadmaps.filter(r => r.roadmapId !== row.roadmap_id);
        else backup.roadmaps.find(r => r.roadmapId === row.roadmap_id)!.archivedAt = action === "archive" ? new Date().toISOString() : null;
        writeDemoBackup(backup); setRows(readDemo());
      } else {
        await accountRequest({ action: action === "restore" ? "unarchive" : action, roadmapId: row.roadmap_id }); await refresh();
      }
    } catch (error) { setMessage(errorText(error)); }
  }

  if (!demo && !user) return <main className="auth-shell"><section className="auth-card"><a className="brand" href="/study-dashboard.html">SEM<span>ASSIST</span></a><p className="eyebrow">ROADMAP LIBRARY</p><h1>Your study plans, in one place.</h1><p className="muted">Sign in to sync roadmaps across your devices, or try the local preview.</p><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label><div className="button-row"><button disabled={busy || !email || !password} onClick={() => void authenticate("signInWithPassword")}>Sign in</button><button className="secondary" disabled={busy || !email || !password} onClick={() => void authenticate("signUp")}>Create account</button></div><a className="muted" href="/roadmaps.html?demo=1">Preview without an account</a>{message && <p className="notice" role="status">{message}</p>}</section></main>;

  return <main className="shell">
    <header className="topbar"><a className="brand" href="/study-dashboard.html">SEM<span>ASSIST</span></a><div className="top-actions">{demo ? <span className="demo-pill">Local demo · saved in this browser</span> : <><span className="user-email">{user?.email}</span><button className="quiet" onClick={() => void signOutSafely()}>Sign out</button></>}</div></header>
    <section className="hero"><div><p className="eyebrow">YOUR LEARNING, ORGANIZED</p><h1>My Roadmaps</h1><p className="muted">Keep your study plans together. Import a roadmap package or start from the sample.</p></div><div className="hero-actions"><label className="button upload">Import JSON<input type="file" accept="application/json,.json" onChange={event => { void previewFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label><button className="secondary" onClick={() => void previewFile(new File([JSON.stringify(fixture)], "beginner-python.json", { type: "application/json" }))}>Try Python sample</button></div></section>
    {message && <div className="notice" role="status">{message}</div>}
    <div className="button-row account-tools"><button className="quiet" disabled={busy} onClick={() => void exportAccount()}>Back up account</button><label className="button secondary upload">Restore backup<input type="file" accept=".json,application/json" onChange={event => { void previewRestore(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
    {restorePreview && <section className="preview-card"><h2>Restore backup preview</h2><p>Exported {new Date(restorePreview.backup.exportedAt).toLocaleString()} · {restorePreview.backup.roadmaps.length} roadmaps · {restorePreview.backup.roadmaps.reduce((n, r) => n + r.records.length, 0)} learner records, including notes.</p><p>Destination: {demo ? "Local demo" : user?.email}. Backup source: {restorePreview.backup.sourceAccount}. Authentication ownership always comes from this signed-in account.</p><label>Restore mode<select value={restoreMode} onChange={e => setRestoreMode(e.target.value as "merge" | "replace")}><option value="merge">Merge — add missing roadmaps, keep existing IDs</option><option value="replace">Replace — replace all account roadmaps</option></select></label><p className="warning">{restorePreview.backup.roadmaps.filter(r => restorePreview.expected.roadmaps.some(old => old.roadmapId === r.roadmapId)).length} colliding roadmap IDs. {restoreMode === "merge" ? "Their complete definitions and learner records will be skipped." : "Existing roadmaps and learner records will be replaced. A pre-restore recovery copy is downloaded first."}</p><div className="button-row"><button disabled={busy} onClick={() => void restoreAccount()}>Confirm restore</button><button className="quiet" onClick={() => setRestorePreview(null)}>Cancel</button></div></section>}
    {planTools && target && <section className="preview-card"><div className="preview-head"><h2>Replan & schedules · {activePackage(planTools).roadmap.title}</h2><button className="quiet" onClick={() => setPlanTools(null)}>Close</button></div><p className="muted">Export a fresh learner baseline with your target constraints. Personal notes and evidence text are excluded unless you choose to share them.</p><div className="replan-fields"><label>Start date<input type="date" value={target.startDate} onInput={e => setTarget({ ...target, startDate: e.currentTarget.value })} /></label><label>Duration<input type="number" min="1" max="3660" value={target.length} onChange={e => setTarget({ ...target, length: Number(e.target.value) })} /></label><label>Duration meaning<select value={target.durationSemantics} onChange={e => setTarget({ ...target, durationSemantics: e.target.value as "total" | "additional" })}><option value="total">Total plan duration</option><option value="additional">Additional time from start date</option></select></label><label>Count days<select value={target.dayBasis} onChange={e => setTarget({ ...target, dayBasis: e.target.value as "calendar-days" | "study-days" })}><option value="calendar-days">Calendar days</option><option value="study-days">Eligible study days</option></select></label><label>Minutes per study day<input type="number" min="1" max="1440" value={target.dailyCapacityMinutes} onChange={e => setTarget({ ...target, dailyCapacityMinutes: Number(e.target.value) })} /></label></div><label>Timezone<input value={target.timezone} onChange={e => setTarget({ ...target, timezone: e.target.value })} placeholder="Asia/Colombo" /></label><fieldset><legend>Eligible study days</legend><div className="weekday-options">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((name, index) => <label className="check-label" key={name}><input type="checkbox" checked={target.studyDays.includes(index + 1)} onChange={e => setTarget({ ...target, studyDays: e.target.checked ? [...target.studyDays, index + 1].sort() : target.studyDays.filter(day => day !== index + 1) })} />{name}</label>)}</div></fieldset><label className="check-label"><input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} />Include private notes and evidence in the snapshot</label><button onClick={() => void exportReplan()}>Export replanning snapshot</button><hr /><label>Saved schedules<select value={activation} onChange={e => setActivation(e.target.value)}><option value="">Choose a schedule to preview</option>{activePackage(planTools).schedules.map(s => <option key={s.scheduleId} value={s.scheduleId} disabled={s.scheduleId === planTools.activeScheduleId}>{s.name}{s.scheduleId === planTools.activeScheduleId ? " (active)" : ""}</option>)}</select></label>{activation && (() => { const value = activePackage(planTools); const schedule = value.schedules.find(s => s.scheduleId === activation)!; const candidate = savedScheduleCandidate(planTools, activation); const checked = validatePackage(candidate); const workload = workloadSummary(candidate); return <div><p>{schedule.startDate} · {schedule.length} {schedule.dayBasis} · {schedule.durationSemantics} · {workload.totalMinutes} minutes · peak {workload.peakMinutes}/{schedule.dailyCapacityMinutes} minutes</p>{(checked.success ? checked.warnings : checked.errors).map((w, i) => <p className="warning" key={i}>{w.path}: {w.message}</p>)}<button disabled={!checked.success || busy} onClick={() => void activateSchedule()}>Activate saved schedule</button></div>; })()}</section>}
    {preview && <section className="preview-card"><div className="preview-head"><div><p className="eyebrow">IMPORT PREVIEW · {preview.roadmap.importKind.toUpperCase()}</p><h2>{preview.roadmap.roadmap.title}</h2></div><button aria-label="Cancel import" className="quiet" onClick={() => setPreview(null)}>Cancel</button></div><p>{preview.roadmap.roadmap.subject ?? "General"} · {preview.roadmap.roadmap.level ?? "Unspecified level"} · {preview.roadmap.content.topics.length} topics · {preview.roadmap.content.tasks.length} tasks · {preview.roadmap.schedules[0].assignments.length} scheduled</p><p className="muted">{preview.added} new task IDs · {preview.removed} prior task IDs not retained · {preview.roadmap.mappings.length} proposed progress mappings</p>{preview.previousWorkload && <p className="muted">Workload: {preview.previousWorkload.totalMinutes} → {preview.nextWorkload.totalMinutes} min · peak day {preview.previousWorkload.peakMinutes} → {preview.nextWorkload.peakMinutes} min · {preview.nextWorkload.overCapacityDays} days exceed {preview.nextWorkload.capacityMinutes} min capacity</p>}
      {preview.topics.length > 0 && <details><summary>Topic changes ({preview.topics.length})</summary>{preview.topics.map(change => <p key={change.id}><strong>{change.kind}: {change.title}</strong>{change.fields.length ? ` · changed ${change.fields.join(", ")}` : ""}</p>)}</details>}
      {preview.tasks.length > 0 && <details><summary>Task changes ({preview.tasks.length})</summary>{preview.tasks.map(change => <p key={change.id}><strong>{change.kind}: {change.title}</strong>{change.fields.length ? ` · changed ${change.fields.join(", ")}` : ""}</p>)}</details>}
      {preview.roadmap.mappings.length > 0 && <section><h3>Choose progress carryover</h3>{preview.roadmap.mappings.map(mapping => <label key={mapping.mappingId}>{mapping.oldTaskIds.length} prior task(s) → {mapping.newTaskIds.length} new task(s) · proposal: {mapping.proposedCarryover} · {mapping.reason}<select value={decisions.find(d => d.mappingId === mapping.mappingId)?.carryover ?? ""} onChange={e => setDecisions(current => [...current.filter(d => d.mappingId !== mapping.mappingId), { mappingId: mapping.mappingId, carryover: e.target.value as MappingDecision["carryover"] }])}><option value="" disabled>Choose explicitly</option><option value="none">Keep originals; copy nothing</option><option value="completion">Copy completion if every prior task is complete</option><option value="notes">Copy notes; preserve originals</option><option value="completion-and-notes">Copy completion and notes; preserve originals</option></select></label>)}</section>}
      {preview.warnings.map((warning, index) => <p className="warning" key={`${warning.path}-${index}`}>{warning.path}: {warning.message}</p>)}<button disabled={busy} onClick={() => void commitImport()}>Confirm import</button></section>}
    <div className="library-toolbar"><div><h2>{showArchived ? "Archived roadmaps" : "Active roadmaps"}</h2><span className="muted">{visibleRows.length} {visibleRows.length === 1 ? "roadmap" : "roadmaps"}</span></div><div className="library-tools"><input aria-label="Search roadmaps" placeholder="Search roadmaps" value={search} onChange={event => setSearch(event.target.value)} /><button className="quiet" onClick={() => setShowArchived(value => !value)}>{showArchived ? "Show active" : "View archived"}</button></div></div>
    {visibleRows.length === 0 ? <section className="empty"><div className="empty-icon">↗</div><h3>{rows.length && search ? "No matching roadmaps" : showArchived ? "Nothing archived" : "Your library is ready"}</h3><p className="muted">Import a JSON package or load the beginner Python sample to preview the workflow.</p>{!rows.length && <button onClick={() => void previewFile(new File([JSON.stringify(fixture)], "beginner-python.json", { type: "application/json" }))}>Load beginner Python</button>}</section> : <section className="cards">{visibleRows.map(row => <article className={`roadmap-card ${activeRoadmap === row.roadmap_id ? "selected" : ""}`} key={row.roadmap_id}><div className="card-top"><span className="subject">{row.subject ?? "GENERAL"}</span><button className="quiet" onClick={() => openStudy(row.roadmap_id)}>Open roadmap</button></div><h3>{row.title}</h3><p className="muted">{row.level ?? "All levels"} · {row.goals?.[0] ?? "Study roadmap"}</p><div className="card-footer"><span className="muted">Updated {new Date(row.updated_at).toLocaleDateString()}</span><div className="card-actions"><button className="quiet" onClick={() => void openPlanTools(row)}>Replan &amp; schedules</button><button className="quiet" onClick={() => void act(row, "export")}>Export</button><button className="quiet" onClick={() => void act(row, "duplicate")}>Duplicate</button><button className="quiet" onClick={() => void act(row, row.archived_at ? "restore" : "archive")}>{row.archived_at ? "Restore" : "Archive"}</button><button className="danger quiet" onClick={() => void act(row, "delete")}>Delete</button></div></div></article>)}</section>}
    <footer><a href="/study-dashboard.html">Open study dashboard</a><span>Roadmap definitions stay separate from your progress and notes.</span></footer>
  </main>;
}
