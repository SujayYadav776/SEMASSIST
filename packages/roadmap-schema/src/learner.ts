import { z } from "zod";

const evidence = z.string().max(10000);
const fields = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
const patch = <T extends z.ZodRawShape>(shape: T) => z.strictObject(shape).partial().refine(value => Object.keys(value).length > 0, "Choose at least one field");
export const learnerMutationSchema = z.strictObject({
  mutationId: z.uuid(), accountId: z.string().min(1), roadmapId: z.uuid(), entityId: z.uuid(),
  baselineRevision: z.number().int().nonnegative(), base: fields,
  payload: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("completion"), changes: z.strictObject({ state: z.enum(["incomplete", "completed"]), completedAt: z.iso.datetime().nullable() }).refine(v => (v.state === "completed") === (v.completedAt !== null), "Completion timestamp must match state") }),
    z.strictObject({ kind: z.literal("note"), changes: z.strictObject({ text: evidence }) }),
    z.strictObject({ kind: z.literal("mastery"), changes: patch({ state: z.enum(["not-assessed", "developing", "demonstrated"]), evidence }) }),
    z.strictObject({ kind: z.literal("milestone"), changes: patch({ state: z.enum(["not-assessed", "in-progress", "demonstrated"]), evidence }) }),
    z.strictObject({ kind: z.literal("study-time"), changes: z.strictObject({ taskId: z.uuid(), minutes: z.number().int().min(1).max(1440), recordedAt: z.iso.datetime() }) }),
    z.strictObject({ kind: z.literal("assignment"), changes: z.strictObject({ scheduleId: z.uuid(), date: z.iso.date(), overrideReason: evidence }) }),
  ]),
});
export type LearnerMutation = z.infer<typeof learnerMutationSchema>;
export type LearnerKind = LearnerMutation["payload"]["kind"];
export type LearnerFields = z.infer<typeof fields>;
export type LearnerRecord = { revision: number; data: LearnerFields };
export function defaultLearnerFields(kind: LearnerKind): LearnerFields {
  if (kind === "completion") return { state: "incomplete", completedAt: null };
  if (kind === "note") return { text: "" };
  if (kind === "mastery" || kind === "milestone") return { state: "not-assessed", evidence: "" };
  return {};
}
export function mergeLearnerMutation(current: LearnerRecord, mutation: LearnerMutation) {
  const changes = mutation.payload.changes;
  const conflict = current.revision !== mutation.baselineRevision && Object.keys(changes).some(key =>
    current.data[key] !== mutation.base[key] && current.data[key] !== (changes as LearnerFields)[key]);
  return { status: conflict ? "conflict" as const : "acknowledged" as const,
    record: conflict ? current : { revision: current.revision + 1, data: { ...current.data, ...changes } } };
}
