import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import fixture from "../examples/beginner-python.json";
import replanned from "../examples/replanned-python.json";
import { assertReplanBaseline, packageSchema, replanSnapshot, validateBackup, type AccountBackup } from "../packages/roadmap-schema/src/index";
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
const value = packageSchema.parse(fixture), roadmap = value.roadmap.roadmapId, task = value.content.tasks[0].taskId;
async function rpc<T>(sql: string, params: unknown[]) { return (await db.query<{ value: T }>(`select ${sql} as value`, params)).rows[0].value; }
async function backup(owner = a) { return validateBackup(await rpc("public.roadmap_account_backup($1)", [owner])); }
async function mutate(owner: string, kind: string, changes: unknown, baselineRevision = 0, base = {}) {
  return rpc<{ status: string; record: { revision: number } }>("public.commit_roadmap_mutation($1,$2)", [owner, { mutationId: randomUUID(), accountId: owner, roadmapId: roadmap, entityId: task, baselineRevision, base, payload: { kind, changes } }]);
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    grant usage on schema auth,public to authenticated,anon,service_role;
    insert into auth.users values('${a}'),('${b}');`);
  for (const file of ["202610100001_roadmap_library.sql", "202610110001_learner_mutations.sql", "202610110002_backup_replan.sql"]) await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
}, 60000);
afterAll(async () => { await db.close(); });
describe.sequential("PostgreSQL roadmap transactions", () => {
  it("imports, completes, and preserves prior schedules during 15-to-30-day replanning", async () => {
    const initial = structuredClone(value); initial.schedules[0].length = 15;
    const id = randomUUID();
    await rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, id, "a".repeat(64), initial, []]);
    await rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, id, "a".repeat(64), initial, []]);
    await mutate(a, "completion", { state: "completed", completedAt: "2026-10-11T00:00:00.000Z" });
    const candidate = packageSchema.parse(replanned); candidate.baseline!.learnerRevision = (await backup()).roadmaps[0].learnerRevision;
    await rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, randomUUID(), "b".repeat(64), candidate, []]);
    const saved = (await backup()).roadmaps[0]; expect(saved.schedules.map(s => s.length).sort()).toEqual([15, 30]);
    expect(saved.records.find(r => r.kind === "completion")?.data.state).toBe("completed");
    await expect(rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, randomUUID(), "c".repeat(64), candidate, []])).rejects.toThrow("changed");
  });
  it("isolates two authenticated accounts and denies direct learner/pointer writes and administrative RPCs", async () => {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${b}',false);`);
    try {
      expect((await db.query("select * from public.roadmaps")).rows).toHaveLength(0);
      for (const table of ["roadmap_revisions", "roadmap_schedules", "roadmap_task_progress", "roadmap_task_notes", "roadmap_topic_mastery", "roadmap_study_time", "roadmap_milestone_evidence", "roadmap_assignment_moves"]) expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0);
      await expect(db.query("update public.roadmaps set active_schedule_id=$1", [value.schedules[0].scheduleId])).rejects.toThrow("permission denied");
      await expect(db.query("select public.roadmap_account_backup($1)", [a])).rejects.toThrow("permission denied");
      await expect(db.query("insert into public.roadmap_task_notes(owner_id,roadmap_id,task_id,text) values($1,$2,$3,'hack')", [a, roadmap, task])).rejects.toThrow("permission denied");
    } finally { await db.exec("reset role"); }
    await expect(mutate(b, "note", { text: "hack" })).rejects.toThrow("not found");
  });
  it("restores a backup into an authenticated destination, skips merge collisions, and retries safely", async () => {
    await mutate(a, "note", { text: "preserve this note" });
    const source = await backup(), expected = await backup(b), id = randomUUID();
    const result = await rpc<{ restored: number; previousBackup: AccountBackup }>("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, id, source, expected, "merge"]);
    expect(result.restored).toBe(1); expect(result.previousBackup.roadmaps).toEqual([]);
    await rpc("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, id, source, expected, "merge"]);
    const restored = await backup(b); expect(restored.sourceAccount).toBe(b); expect(restored.roadmaps[0].records.find(r => r.kind === "note")?.data.text).toBe("preserve this note");
    expect(await rpc("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, randomUUID(), source, restored, "merge"])).toMatchObject({ restored: 0 });
  });
  it("rejects stale restore/activation previews and rolls a failing replacement back atomically", async () => {
    const before = await backup(b);
    const bad = structuredClone(before); bad.roadmaps[0].records.find(r => r.kind === "note")!.data.text = "x".repeat(10001);
    await expect(rpc("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, randomUUID(), bad, before, "replace"])).rejects.toThrow();
    expect((await backup(b)).roadmaps).toEqual(before.roadmaps);
    await mutate(b, "note", { text: "newer note" }, before.roadmaps[0].records.find(r => r.kind === "note")!.revision, { text: "preserve this note" });
    await expect(rpc("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, randomUUID(), before, before, "replace"])).rejects.toThrow("changed");
    const item = before.roadmaps[0];
    await expect(rpc("public.manage_roadmap($1,$2,'activate',$3,$4)", [b, roadmap, { revisionId: item.activeRevisionId, scheduleId: item.activeScheduleId, learnerRevision: item.learnerRevision }, value.schedules[0].scheduleId])).rejects.toThrow("changed");
  });
  it("replacement advances record revisions so a stale device cannot silently overwrite a restored note", async () => {
    const before = await backup(b), old = before.roadmaps[0].records.find(r => r.kind === "note")!;
    const incoming = structuredClone(before); incoming.roadmaps[0].records.find(r => r.kind === "note")!.data.text = "restored note";
    await rpc("public.restore_roadmap_account($1,$2,$3,$4,$5)", [b, randomUUID(), incoming, before, "replace"]);
    const result = await mutate(b, "note", { text: "stale device note" }, old.revision, { text: old.data.text });
    expect(result.status).toBe("conflict"); expect((await backup(b)).roadmaps[0].records.find(r => r.kind === "note")?.data.text).toBe("restored note");
  });
  it("activates an existing schedule with a fresh baseline while preserving all learner records", async () => {
    const before = (await backup()).roadmaps[0];
    await rpc("public.manage_roadmap($1,$2,'activate',$3,$4)", [a, roadmap, { revisionId: before.activeRevisionId, scheduleId: before.activeScheduleId, learnerRevision: before.learnerRevision }, value.schedules[0].scheduleId]);
    const after = (await backup()).roadmaps[0]; expect(after.activeScheduleId).toBe(value.schedules[0].scheduleId); expect(after.records).toEqual(before.records); expect(after.schedules).toHaveLength(2);
    await rpc("public.manage_roadmap($1,$2,'activate',$3,$4)", [a, roadmap, { revisionId: after.activeRevisionId, scheduleId: after.activeScheduleId, learnerRevision: after.learnerRevision }, before.activeScheduleId]);
  });
  it("requires mapping decisions and preserves original notes and removed-task history", async () => {
    const item = (await backup()).roadmaps[0];
    const candidate = packageSchema.parse(replanned);
    candidate.importKind = "revision"; candidate.baseline = replanSnapshot(item, candidate.schedules[0]).baseline;
    candidate.content.predecessorRevisionId = item.activeRevisionId; candidate.content.revisionId = randomUUID();
    const first = randomUUID(), second = randomUUID();
    const original = candidate.content.tasks.shift()!;
    candidate.content.tasks.push({ ...original, taskId: first, title: "First split", minutes: 15 }, { ...original, taskId: second, title: "Second split", minutes: 15 });
    candidate.content.milestones.forEach(m => { m.taskIds = m.taskIds.flatMap(id => id === task ? [first, second] : [id]); });
    const schedule = candidate.schedules[0]; schedule.scheduleId = randomUUID(); schedule.revisionId = candidate.content.revisionId;
    schedule.assignments.push({ assignmentId: randomUUID(), taskId: first, date: "2026-10-12" }, { assignmentId: randomUUID(), taskId: second, date: "2026-10-12" });
    const mappingId = randomUUID(); candidate.mappings = [{ mappingId, oldTaskIds: [task], newTaskIds: [first, second], reason: "Split practice", proposedCarryover: "completion-and-notes" }];
    const decisions = [{ mappingId, carryover: "completion-and-notes" as const }];
    assertReplanBaseline(item, candidate, decisions);
    await expect(rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, randomUUID(), "d".repeat(64), candidate, []])).rejects.toThrow("Choose carryover");
    expect((await backup()).roadmaps).toEqual([item]);
    await rpc("public.commit_roadmap_import($1,$2,$3,$4,$5)", [a, randomUUID(), "e".repeat(64), candidate, decisions]);
    const saved = (await backup()).roadmaps[0];
    for (const id of [task, first, second]) expect(saved.records.find(r => r.kind === "note" && r.entityId === id)?.data.text).toBe("preserve this note");
    expect(saved.records.filter(r => r.kind === "completion")).toHaveLength(3);
    expect(saved.packages).toHaveLength(2);
    expect(replanSnapshot(saved, candidate.schedules[0]).baseline.completedTaskIds.sort()).toEqual([first, second].sort());
  });
});
