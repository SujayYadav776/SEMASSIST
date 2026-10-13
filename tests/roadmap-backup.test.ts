import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import fixture from "../examples/beginner-python.json";
import replanned from "../examples/replanned-python.json";
import { activePackage, assertReplanBaseline, carryoverRecords, packageSchema, replanSnapshot, savedScheduleCandidate, validatePackage, validateBackup, type AccountBackup } from "../packages/roadmap-schema/src/index";
const value = packageSchema.parse(fixture);
const task = value.content.tasks[0].taskId;
function backup(): AccountBackup { return validateBackup({ format: "semassist-backup", version: 1, exportedAt: "2026-10-11T00:00:00.000Z", sourceAccount: "demo", roadmaps: [{ roadmapId: value.roadmap.roadmapId, activeRevisionId: value.content.revisionId, activeScheduleId: value.schedules[0].scheduleId, archivedAt: null, learnerRevision: 1, packages: [value], records: [{ kind: "completion", entityId: task, revision: 1, data: { state: "completed", completedAt: "2026-10-11T00:00:00.000Z" } }, { kind: "note", entityId: task, revision: 1, data: { text: "private note" } }] }] }); }
describe("backup and replanning contract", () => {
  it("round trips IDs and learner data, excluding private notes from replanning by default", () => {
    const original = backup(); expect(validateBackup(JSON.parse(JSON.stringify(original)))).toEqual(original);
    const item = original.roadmaps[0]; const snapshot = replanSnapshot(item, value.schedules[0]);
    expect(JSON.stringify(snapshot)).not.toContain("private note"); expect(snapshot.baseline.completedTaskIds).toEqual([task]);
    expect(JSON.stringify(replanSnapshot(item, value.schedules[0], true))).toContain("private note");
  });
  it("rejects unknown versions, owner fields, dangling records and immutable collisions", () => {
    expect(() => validateBackup({ ...backup(), version: 2 })).toThrow();
    const next = backup(); next.roadmaps[0].records[0].entityId = randomUUID(); expect(() => validateBackup(next)).toThrow("missing from history");
    const collision = backup(); const copy = structuredClone(value); copy.content.tasks[0].title = "Different"; collision.roadmaps[0].packages.push(copy); expect(() => validateBackup(collision)).toThrow("collision");
    expect(() => validateBackup({ ...backup(), owner_id: randomUUID() })).toThrow();
  });
  it("retains independent schedule versions for a 15-to-30-day replan and rejects stale activation", () => {
    const item = backup().roadmaps[0]; item.packages[0].schedules[0].length = 15;
    const candidate = packageSchema.parse(replanned); assertReplanBaseline(item, candidate, []);
    item.packages.push(candidate); item.activeScheduleId = candidate.schedules[0].scheduleId;
    expect(activePackage(item).schedules.map(s => s.length)).toEqual([30, 15]);
    expect(validatePackage(savedScheduleCandidate(item, value.schedules[0].scheduleId)).success).toBe(true);
    item.activeScheduleId = value.schedules[0].scheduleId;
    expect(validatePackage(savedScheduleCandidate(item, candidate.schedules[0].scheduleId)).success).toBe(true);
    item.learnerRevision++; expect(() => assertReplanBaseline(item, candidate, [])).toThrow("changed");
  });
  it("requires fresh IDs for substantial changes and explicit carryover decisions", () => {
    const item = backup().roadmaps[0]; const candidate = packageSchema.parse(replanned);
    candidate.importKind = "revision"; candidate.content.predecessorRevisionId = value.content.revisionId; candidate.content.revisionId = randomUUID();
    candidate.content.tasks[0].objective = "Changed objective";
    expect(() => assertReplanBaseline(item, candidate, [])).toThrow("new IDs");
    const nextTask = randomUUID(); candidate.content.tasks[0].taskId = nextTask;
    candidate.mappings = [{ mappingId: randomUUID(), oldTaskIds: [task], newTaskIds: [nextTask], reason: "New assessment", proposedCarryover: "completion-and-notes" }];
    expect(() => assertReplanBaseline(item, candidate, [])).toThrow("explicitly");
    const decisions = [{ mappingId: candidate.mappings[0].mappingId, carryover: "completion-and-notes" as const }];
    assertReplanBaseline(item, candidate, decisions);
    const records = { [`completion:${task}`]: { revision: 1, data: { state: "completed", completedAt: "2026-10-11T00:00:00.000Z" } }, [`note:${task}`]: { revision: 1, data: { text: "original" } } };
    const copied = carryoverRecords(records, candidate, decisions);
    expect(copied[`note:${nextTask}`].data.text).toBe("original"); expect(copied[`note:${task}`]).toEqual(records[`note:${task}`]);
    expect(carryoverRecords(records, candidate, [{ ...decisions[0], carryover: "none" }])[`completion:${nextTask}`]).toBeUndefined();
  });
});
