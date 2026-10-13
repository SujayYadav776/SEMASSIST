import { activePackage, backupRecords, recordsFromBackup, validateBackup, type AccountBackup, type RoadmapPackage } from "../../packages/roadmap-schema/src/index";
export const demoKey = "semassist-roadmaps-demo-v1";
export const demoAccountKey = "semassist-demo-account-v1";
export function readDemoBackup(): AccountBackup {
  const existing = localStorage.getItem(demoAccountKey);
  if (existing) { const stored = JSON.parse(existing); return validateBackup(stored.backup ?? stored); }
  const rows = JSON.parse(localStorage.getItem(demoKey) ?? "[]") as { roadmap_id: string; archived_at: string | null }[];
  return validateBackup({ format: "semassist-backup", version: 1, exportedAt: new Date().toISOString(), sourceAccount: "demo", roadmaps: rows.map(row => {
    const value = JSON.parse(localStorage.getItem(`${demoKey}:${row.roadmap_id}`) ?? "null") as RoadmapPackage;
    if (!value) throw new Error("Demo definition missing; recover the original package before exporting");
    const server = JSON.parse(localStorage.getItem(`semassist-study-demo-server:${row.roadmap_id}`) ?? '{"records":{}}');
    return { roadmapId: row.roadmap_id, activeRevisionId: value.content.revisionId, activeScheduleId: value.schedules[0].scheduleId, archivedAt: row.archived_at, learnerRevision: Math.max(0, ...Object.values(server.records as Record<string, { revision: number }>).map(r => r.revision)), packages: [value], records: backupRecords(server.records) };
  }) });
}
export function writeDemoBackup(backup: AccountBackup, receipts?: unknown) {
  const valid = validateBackup({ ...backup, sourceAccount: "demo", exportedAt: new Date().toISOString() });
  const previous = JSON.parse(localStorage.getItem(demoAccountKey) ?? "{}");
  localStorage.setItem(demoAccountKey, JSON.stringify({ backup: valid, receipts: receipts ?? previous.receipts ?? {} }));
}
export function demoRows() {
  return readDemoBackup().roadmaps.map(item => {
    const value = activePackage(item);
    return { roadmap_id: item.roadmapId, title: value.roadmap.title, subject: value.roadmap.subject ?? null, level: value.roadmap.level ?? null, goals: value.roadmap.goals, active_revision_id: item.activeRevisionId, active_schedule_id: item.activeScheduleId, archived_at: item.archivedAt, updated_at: value.generatedAt };
  });
}
export function demoRecords(roadmapId: string) { return recordsFromBackup(readDemoBackup().roadmaps.find(r => r.roadmapId === roadmapId)!); }
