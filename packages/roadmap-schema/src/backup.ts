import { z } from "zod";
import { packageSchema, scheduleSchema, type RoadmapPackage } from "./schema.ts";
import { validatePackage } from "./validate.ts";
import { learnerMutationSchema, type LearnerKind, type LearnerRecord } from "./learner.ts";

export const backupSchema = z.strictObject({
  format: z.literal("semassist-backup"), version: z.literal(1), exportedAt: z.iso.datetime(),
  sourceAccount: z.string().min(1),
  roadmaps: z.array(z.strictObject({
    roadmapId: z.uuid(), activeRevisionId: z.uuid(), activeScheduleId: z.uuid(),
    archivedAt: z.iso.datetime().nullable(), learnerRevision: z.number().int().nonnegative(),
    packages: z.array(packageSchema).min(1),
    schedules: z.array(scheduleSchema).default([]),
    records: z.array(z.strictObject({ kind: z.enum(["completion", "note", "mastery", "milestone", "study-time", "assignment"]), entityId: z.uuid(), revision: z.number().int().nonnegative(), data: z.record(z.string(), z.union([z.string(), z.number(), z.null()])) })),
  })),
});
export type AccountBackup = z.infer<typeof backupSchema>;
export type BackupRoadmap = AccountBackup["roadmaps"][number];
export const mappingDecisionsSchema = z.array(z.strictObject({ mappingId: z.uuid(), carryover: z.enum(["none", "completion", "notes", "completion-and-notes"]) }));
export type MappingDecision = z.infer<typeof mappingDecisionsSchema>[number];

export function validateBackup(input: unknown): AccountBackup {
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 25 * 1024 * 1024) throw new Error("Backup exceeds 25 MiB");
  const backup = backupSchema.parse(input);
  const roadmaps = new Set<string>();
  const timeEntries = new Set<string>();
  for (const item of backup.roadmaps) {
    if (roadmaps.has(item.roadmapId)) throw new Error("Duplicate roadmap ID in backup");
    roadmaps.add(item.roadmapId);
    const definitions = new Map<string, string>();
    const tasks = new Set<string>(), topics = new Set<string>(), milestones = new Set<string>();
    const assignments = new Map<string, string>();
    for (const value of item.packages) {
      const result = validatePackage(value);
      if (!result.success) throw new Error(result.errors.map(error => `${error.path}: ${error.message}`).join("\n"));
      if (value.roadmap.roadmapId !== item.roadmapId) throw new Error("Backup package belongs to another roadmap");
      for (const [id, definition] of [[value.content.revisionId, value.content], ...value.schedules.map(s => [s.scheduleId, s])] as [string, unknown][]) {
        const bytes = JSON.stringify(definition);
        if (definitions.has(id) && definitions.get(id) !== bytes) throw new Error("Immutable ID collision in backup");
        definitions.set(id, bytes);
      }
      value.content.tasks.forEach(t => tasks.add(t.taskId));
      value.content.topics.forEach(t => topics.add(t.topicId));
      value.content.milestones.forEach(t => milestones.add(t.milestoneId));
      value.schedules.forEach(s => s.assignments.forEach(a => assignments.set(a.assignmentId, s.scheduleId)));
    }
    for (const schedule of item.schedules) {
      const value = item.packages.find(p => p.content.revisionId === schedule.revisionId);
      if (!value) throw new Error("Schedule revision missing from backup");
      const result = validatePackage({ ...value, importKind: "schedule", mappings: [], schedules: [schedule], baseline: { revisionId: value.content.revisionId, scheduleId: "00000000-0000-0000-0000-000000000000", learnerRevision: item.learnerRevision, taskIds: value.content.tasks.map(t => t.taskId), completedTaskIds: value.content.tasks.map(t => t.taskId) } });
      if (!result.success) throw new Error(result.errors.map(e => `${e.path}: ${e.message}`).join("\n"));
      const bytes = JSON.stringify(schedule);
      if (definitions.has(schedule.scheduleId) && definitions.get(schedule.scheduleId) !== bytes) throw new Error("Immutable schedule collision");
      definitions.set(schedule.scheduleId, bytes);
      schedule.assignments.forEach(a => assignments.set(a.assignmentId, schedule.scheduleId));
    }
    if (!item.packages.some(p => p.content.revisionId === item.activeRevisionId) || ![...item.schedules, ...item.packages.flatMap(p => p.schedules)].some(s => s.scheduleId === item.activeScheduleId && s.revisionId === item.activeRevisionId)) throw new Error("Active revision/schedule missing from backup");
    for (const value of item.packages) if (value.content.predecessorRevisionId && !definitions.has(value.content.predecessorRevisionId)) throw new Error("Revision history is incomplete");
    const recordIds = new Set<string>();
    for (const record of item.records) {
      const key = `${record.kind}:${record.entityId}`;
      if (recordIds.has(key)) throw new Error("Duplicate learner record");
      recordIds.add(key);
      learnerMutationSchema.parse({ mutationId: record.entityId, accountId: backup.sourceAccount, roadmapId: item.roadmapId, entityId: record.entityId, baselineRevision: record.revision, base: {}, payload: { kind: record.kind, changes: record.data } });
      if ((record.kind === "mastery" || record.kind === "milestone") && (!record.data.state || typeof record.data.evidence !== "string")) throw new Error("Incomplete evidence record");
      if ((record.kind === "completion" || record.kind === "note") && !tasks.has(record.entityId)) throw new Error("Learner task missing from history");
      if (record.kind === "mastery" && !topics.has(record.entityId)) throw new Error("Learner topic missing from history");
      if (record.kind === "milestone" && !milestones.has(record.entityId)) throw new Error("Learner milestone missing from history");
      if (record.kind === "assignment" && assignments.get(record.entityId) !== record.data.scheduleId) throw new Error("Learner assignment missing from schedule");
      if (record.kind === "study-time") {
        if (!tasks.has(String(record.data.taskId)) || timeEntries.has(record.entityId)) throw new Error("Invalid or duplicate study time entry");
        timeEntries.add(record.entityId);
      }
    }
  }
  return backup;
}

export function activePackage(item: BackupRoadmap): RoadmapPackage {
  const value = item.packages.find(p => p.content.revisionId === item.activeRevisionId)!;
  const schedules = [...item.packages.filter(p => p.content.revisionId === item.activeRevisionId).flatMap(p => p.schedules), ...item.schedules.filter(s => s.revisionId === item.activeRevisionId)];
  const unique = [...new Map(schedules.map(s => [s.scheduleId, s])).values()];
  unique.sort((a, b) => Number(b.scheduleId === item.activeScheduleId) - Number(a.scheduleId === item.activeScheduleId));
  return { ...value, schedules: unique };
}

export function replanSnapshot(item: BackupRoadmap, target: RoadmapPackage["schedules"][number], includeNotes = false) {
  const value = activePackage(item);
  const records = item.records.filter(r => includeNotes || (r.kind !== "note" && r.kind !== "mastery" && r.kind !== "milestone"));
  return { format: "semassist-replan", version: 1, exportedAt: new Date().toISOString(), package: value,
    baseline: { revisionId: item.activeRevisionId, scheduleId: item.activeScheduleId, learnerRevision: item.learnerRevision, taskIds: value.content.tasks.map(t => t.taskId), completedTaskIds: item.records.filter(r => r.kind === "completion" && r.data.state === "completed" && value.content.tasks.some(t => t.taskId === r.entityId)).map(r => r.entityId) },
    mastery: item.records.filter(r => r.kind === "mastery").map(r => ({ topicId: r.entityId, state: r.data.state })),
    records, target: { startDate: target.startDate, timezone: target.timezone, length: target.length, durationSemantics: target.durationSemantics, dayBasis: target.dayBasis, studyDays: target.studyDays, dailyCapacityMinutes: target.dailyCapacityMinutes } };
}

export function savedScheduleCandidate(item: BackupRoadmap, scheduleId: string): RoadmapPackage {
  const value = activePackage(item), schedule = value.schedules.find(s => s.scheduleId === scheduleId);
  if (!schedule) throw new Error("Saved schedule does not match the active content revision");
  return { ...value, importKind: "schedule", mappings: [], schedules: [schedule], baseline: replanSnapshot(item, schedule).baseline };
}

export function assertReplanBaseline(item: BackupRoadmap, value: RoadmapPackage, decisions: MappingDecision[]) {
  const previous = activePackage(item);
  const baseline = replanSnapshot(item, previous.schedules[0]).baseline;
  if (!value.baseline || value.baseline.revisionId !== baseline.revisionId || value.baseline.scheduleId !== baseline.scheduleId || value.baseline.learnerRevision !== baseline.learnerRevision || JSON.stringify([...value.baseline.taskIds].sort()) !== JSON.stringify([...baseline.taskIds].sort()) || JSON.stringify([...value.baseline.completedTaskIds].sort()) !== JSON.stringify([...baseline.completedTaskIds].sort())) throw new Error("Plan or learner progress changed. Export an updated snapshot and preview again.");
  if (value.importKind === "schedule" && JSON.stringify(value.content) !== JSON.stringify(previous.content)) throw new Error("A schedule change cannot alter content");
  if (value.importKind === "revision" && (value.content.revisionId === baseline.revisionId || value.content.predecessorRevisionId !== baseline.revisionId)) throw new Error("Revision must name its predecessor and use a new revision ID");
  for (const task of value.content.tasks) {
    const originals = item.packages.flatMap(p => p.content.tasks).filter(t => t.taskId === task.taskId);
    if (originals.some(old => ["instructions", "objective", "criteria", "type", "topicId"].some(key => JSON.stringify(old[key as keyof typeof old]) !== JSON.stringify(task[key as keyof typeof task])))) throw new Error("Substantially changed tasks need new IDs and an explicit mapping; original progress stays in history");
  }
  mappingDecisionsSchema.parse(decisions);
  if (decisions.length !== value.mappings.length || new Set(decisions.map(d => d.mappingId)).size !== decisions.length || value.mappings.some(m => !decisions.some(d => d.mappingId === m.mappingId))) throw new Error("Choose carryover explicitly for every mapping");
  const targets = new Set<string>();
  for (const mapping of value.mappings) for (const id of mapping.newTaskIds) {
    if (targets.has(id) || item.packages.some(p => p.content.tasks.some(t => t.taskId === id))) throw new Error("Mapping targets must be new task IDs and may appear in only one mapping");
    targets.add(id);
  }
}

export function carryoverRecords(records: Record<string, LearnerRecord>, value: RoadmapPackage, decisions: MappingDecision[]) {
  const next = structuredClone(records);
  for (const mapping of value.mappings) {
    const decision = decisions.find(d => d.mappingId === mapping.mappingId)!;
    const completed = mapping.oldTaskIds.map(id => records[`completion:${id}`]?.data).filter(d => d?.state === "completed");
    const note = mapping.oldTaskIds.map(id => records[`note:${id}`]?.data.text).filter(Boolean).join("\n\n");
    if (note.length > 10000 && decision.carryover.includes("notes")) throw new Error("Combined notes exceed 10,000 characters; keep originals instead");
    for (const id of mapping.newTaskIds) {
      if (decision.carryover.includes("completion") && completed.length === mapping.oldTaskIds.length) next[`completion:${id}`] = { revision: 1, data: { state: "completed", completedAt: completed.map(d => String(d.completedAt)).sort().at(-1)! } };
      if (decision.carryover.includes("notes") && note) next[`note:${id}`] = { revision: 1, data: { text: note } };
    }
  }
  return next;
}

export function recordsFromBackup(item: BackupRoadmap): Record<string, LearnerRecord> {
  return Object.fromEntries(item.records.map(r => [`${r.kind}:${r.entityId}`, { revision: r.revision, data: r.data }]));
}
export function backupRecords(records: Record<string, LearnerRecord>) {
  return Object.entries(records).map(([key, record]) => ({ kind: key.slice(0, key.indexOf(":")) as LearnerKind, entityId: key.slice(key.indexOf(":") + 1), ...record }));
}
