import { z } from "zod";

export const SCHEMA_VERSION = "1.0.0";
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const id = z.uuid();
const text = z.string().trim().min(1).max(10000);
const date = z.iso.date();
const timestamp = z.iso.datetime();
const ids = z.array(id);
const revision = z.number().int().nonnegative();
const url = z.url({ protocol: /^https?$/ });

export const resourceSchema = z.strictObject({
  resourceId: id,
  sourceType: z.enum([
    "book",
    "repository",
    "roadmap",
    "video",
    "playlist",
    "course",
    "documentation",
    "article",
    "other",
  ]),
  title: text,
  url: url.optional(),
  reference: text.optional(),
  locator: z
    .strictObject({
      chapter: text.optional(),
      pages: text.optional(),
      section: text.optional(),
      timestamp: text.optional(),
    })
    .optional(),
  accessStatus: z.enum([
    "public",
    "login-required",
    "paid",
    "private",
    "unavailable",
    "unknown",
  ]),
  role: z.enum(["primary", "supplementary"]),
  provenance: z.strictObject({
    accessed: z.boolean(),
    accessedAt: timestamp.optional(),
    method: text,
    limitations: z.array(text),
    confidence: z.number().min(0).max(1),
  }),
});

export const topicSchema = z.strictObject({
  topicId: id,
  title: text,
  objectives: z.array(text).min(1),
  prerequisiteTopicIds: ids,
  resourceIds: ids,
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  classification: z.enum(["core", "prerequisite", "optional", "advanced"]),
});

export const taskSchema = z.strictObject({
  taskId: id,
  topicId: id,
  title: text,
  instructions: text,
  objective: text,
  type: z.enum(["learn", "practice", "review", "assessment", "project"]),
  required: z.boolean(),
  minutes: z.number().int().min(1).max(1440),
  resourceIds: ids,
  criteria: z.array(text).min(1),
});

const assignmentBase = {
  assignmentId: id,
  taskId: id,
  overrideReason: text.optional(),
};
export const assignmentSchema = z.union([
  z.strictObject({ ...assignmentBase, date }),
  z.strictObject({
    ...assignmentBase,
    dayOffset: z.number().int().min(0).max(3660),
  }),
]);

export const scheduleSchema = z.strictObject({
  scheduleId: id,
  revisionId: id,
  name: text,
  timezone: text,
  startDate: date,
  length: z.number().int().min(1).max(3660),
  durationSemantics: z.enum(["total", "additional"]),
  dayBasis: z.enum(["calendar-days", "study-days"]),
  studyDays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  dailyCapacityMinutes: z.number().int().min(1).max(1440),
  assignments: z.array(assignmentSchema),
  milestonePlacements: z.array(z.strictObject({ milestoneId: id, date })),
  workloadOverrides: z.array(z.strictObject({ date, reason: text })),
});

export const milestoneSchema = z.strictObject({
  milestoneId: id,
  title: text,
  taskIds: ids,
  topicIds: ids,
  criteria: z.array(text).min(1),
});

export const packageSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  packageId: id,
  generatedAt: timestamp,
  generator: z.strictObject({
    name: text,
    version: text,
    assumptions: z.array(text),
  }),
  importKind: z.enum(["new", "revision", "schedule"]),
  baseline: z
    .strictObject({
      revisionId: id,
      scheduleId: id,
      taskIds: ids,
      completedTaskIds: ids.default([]),
      learnerRevision: revision.default(0),
    })
    .optional(),
  roadmap: z.strictObject({
    roadmapId: id,
    title: text,
    goals: z.array(text).min(1),
    subject: text.optional(),
    level: text.optional(),
    learnerAssumptions: z.array(text),
  }),
  content: z.strictObject({
    revisionId: id,
    predecessorRevisionId: id.optional(),
    topics: z.array(topicSchema).min(1),
    tasks: z.array(taskSchema),
    resources: z.array(resourceSchema),
    milestones: z.array(milestoneSchema),
  }),
  schedules: z.array(scheduleSchema).min(1),
  mappings: z.array(
    z.strictObject({
      mappingId: id,
      oldTaskIds: ids.min(1),
      newTaskIds: ids.min(1),
      reason: text,
      proposedCarryover: z.enum([
        "none",
        "completion",
        "notes",
        "completion-and-notes",
      ]),
    })
  ),
});

// Dashboard records have separate schemas and cannot appear in an agent package.
const completion = {
  state: z.enum(["incomplete", "completed"]),
  completedAt: timestamp.nullable(),
};
const validCompletion = (value: {
  state: string;
  completedAt: string | null;
}) => (value.state === "completed") === (value.completedAt !== null);
export const progressSchema = z
  .strictObject({
    accountId: id,
    roadmapId: id,
    taskId: id,
    ...completion,
    revision,
  })
  .refine(validCompletion, {
    path: ["completedAt"],
    message: "Only completed tasks have a completion timestamp",
  });
export const noteSchema = z.strictObject({
  accountId: id,
  roadmapId: id,
  taskId: id,
  text: z.string().max(10000),
  revision,
});
export const masterySchema = z.strictObject({
  accountId: id,
  roadmapId: id,
  topicId: id,
  state: z.enum(["not-assessed", "developing", "demonstrated"]),
  evidence: z.string().max(10000),
  revision,
});
export const studyTimeSchema = z.strictObject({
  entryId: id,
  accountId: id,
  roadmapId: id,
  taskId: id,
  minutes: z.number().int().min(1).max(1440),
  recordedAt: timestamp,
  revision,
});
export const milestoneEvidenceSchema = z.strictObject({
  accountId: id,
  roadmapId: id,
  milestoneId: id,
  state: z.enum(["not-assessed", "in-progress", "demonstrated"]),
  evidence: z.string().max(10000),
  revision,
});
export const mutationSchema = z.strictObject({
  mutationId: id,
  accountId: id,
  roadmapId: id,
  entityId: id,
  baselineRevision: revision,
  status: z.enum(["pending", "acknowledged", "conflict", "error"]),
  payload: z.discriminatedUnion("kind", [
    z
      .strictObject({ kind: z.literal("completion"), ...completion })
      .refine(validCompletion, {
        path: ["completedAt"],
        message: "Only completed tasks have a completion timestamp",
      }),
    z.strictObject({ kind: z.literal("note"), text: z.string().max(10000) }),
    z.strictObject({
      kind: z.literal("mastery"),
      state: z.enum(["not-assessed", "developing", "demonstrated"]),
      evidence: z.string().max(10000),
    }),
    z.strictObject({
      kind: z.literal("study-time"),
      minutes: z.number().int().min(1).max(1440),
      recordedAt: timestamp,
    }),
    z.strictObject({
      kind: z.literal("milestone"),
      state: z.enum(["not-assessed", "in-progress", "demonstrated"]),
      evidence: z.string().max(10000),
    }),
  ]),
});

export type RoadmapPackage = z.infer<typeof packageSchema>;
export const packageJsonSchema = () => z.toJSONSchema(packageSchema);
