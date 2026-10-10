import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fixture from "../examples/beginner-python.json";
import cycle from "../examples/invalid-cycle.json";
import { tracks, taskId } from "../client/public/study-dashboard.js";
import mapping from "../packages/roadmap-schema/legacy-task-map.json";
import {
  packageSchema,
  packageJsonSchema,
  parsePackageJson,
  validatePackage,
  prepareLegacyMigration,
  restoreLegacyBackup,
  mutationSchema,
  progressSchema,
  type RoadmapPackage,
} from "../packages/roadmap-schema/src/index";

const candidate = () => packageSchema.parse(structuredClone(fixture));
const errors = (data: unknown) => {
  const result = validatePackage(data);
  expect(result.success).toBe(false);
  return result.success ? [] : result.errors;
};

describe("roadmap contract", () => {
  it("validates a beginner fixture and derives JSON Schema from the same contract", () => {
    expect(parsePackageJson(JSON.stringify(fixture))).toMatchObject({
      success: true,
      warnings: [],
    });
    expect(packageJsonSchema()).toMatchObject({
      type: "object",
      additionalProperties: false,
    });
    expect(packageJsonSchema().properties?.schemaVersion).toMatchObject({
      const: "1.0.0",
    });
  });

  it("rejects invalid JSON, unsupported versions, and UTF-8 byte overflow", () => {
    expect(parsePackageJson("{")).toMatchObject({ success: false });
    expect(parsePackageJson('"é"', 3)).toMatchObject({
      success: false,
      errors: [{ path: "$", message: "Package exceeds 3 bytes" }],
    });
    expect(() => parsePackageJson("{}", 0)).toThrow(RangeError);
    expect(errors({ ...fixture, schemaVersion: "2.0.0" })[0].path).toBe(
      "schemaVersion"
    );
  });

  const invalid: [string, (data: RoadmapPackage) => void, string][] = [
    [
      "duplicate identities",
      data => {
        data.content.tasks[1].taskId = data.content.tasks[0].taskId;
      },
      "content.tasks.1.taskId",
    ],
    [
      "dangling resources",
      data => {
        data.content.tasks[0].resourceIds = [data.packageId];
      },
      "content.tasks.0.resourceIds.0",
    ],
    [
      "unsafe URLs",
      data => {
        data.content.resources[0].url = "javascript:alert(1)";
      },
      "content.resources.0.url",
    ],
    [
      "missing resource references",
      data => {
        delete data.content.resources[0].url;
      },
      "content.resources.0",
    ],
    [
      "false access claims",
      data => {
        data.content.resources[0].provenance.accessedAt = data.generatedAt;
      },
      "content.resources.0.provenance.accessedAt",
    ],
    [
      "impossible dates",
      data => {
        data.schedules[0].startDate = "2026-02-30";
      },
      "schedules.0.startDate",
    ],
    [
      "unknown timezones",
      data => {
        data.schedules[0].timezone = "MadeUp/Zone";
      },
      "schedules.0.timezone",
    ],
    [
      "negative estimates",
      data => {
        data.content.tasks[0].minutes = -1;
      },
      "content.tasks.0.minutes",
    ],
    [
      "non-study dates",
      data => {
        data.schedules[0].assignments[0] = {
          ...data.schedules[0].assignments[0],
          date: "2026-10-18",
        };
      },
      "schedules.0.assignments.0",
    ],
    [
      "out-of-range offsets",
      data => {
        data.schedules[0].assignments[0] = {
          assignmentId: data.schedules[0].assignments[0].assignmentId,
          taskId: data.content.tasks[0].taskId,
          dayOffset: 5,
        };
      },
      "schedules.0.assignments.0",
    ],
    [
      "unassigned required tasks",
      data => {
        data.schedules[0].assignments.pop();
      },
      "schedules.0.assignments",
    ],
    [
      "duplicate assignments",
      data => {
        data.schedules[0].assignments[1].taskId =
          data.schedules[0].assignments[0].taskId;
      },
      "schedules.0.assignments.1.taskId",
    ],
    [
      "unexplained overload",
      data => {
        data.schedules[0].dailyCapacityMinutes = 20;
      },
      "schedules.0.assignments",
    ],
    [
      "wrong revision",
      data => {
        data.schedules[0].revisionId = data.packageId;
      },
      "schedules.0.revisionId",
    ],
    [
      "missing baseline",
      data => {
        data.importKind = "revision";
      },
      "baseline",
    ],
    [
      "new-plan carryover",
      data => {
        data.baseline = {
          revisionId: data.packageId,
          scheduleId: data.roadmap.roadmapId,
          taskIds: [],
          completedTaskIds: [],
          learnerRevision: 0,
        };
      },
      "baseline",
    ],
    [
      "invalid milestone",
      data => {
        data.schedules[0].milestonePlacements[0].date = "2026-10-18";
      },
      "schedules.0.milestonePlacements.0.date",
    ],
  ];
  it.each(invalid)(
    "rejects %s with an actionable path",
    (_name, mutate, path) => {
      const data = candidate();
      mutate(data);
      expect(errors(data).some(issue => issue.path.startsWith(path))).toBe(
        true
      );
    }
  );

  it("rejects cycles without modifying the caller's input", () => {
    const before = JSON.stringify(cycle);
    expect(errors(cycle)).toContainEqual({
      path: "content.topics",
      message: "Dependency cycle or unresolved prerequisite",
    });
    expect(JSON.stringify(cycle)).toBe(before);
  });

  it("requires prerequisite learning on earlier dates and reports documented overrides", () => {
    const data = candidate();
    data.schedules[0].assignments[1] = {
      ...data.schedules[0].assignments[1],
      dayOffset: 0,
    };
    data.schedules[0].dailyCapacityMinutes = 90;
    expect(
      errors(data).some(issue => issue.message.includes("Prerequisite"))
    ).toBe(true);
    data.schedules[0].assignments[1].overrideReason =
      "Learner already knows variables";
    expect(validatePackage(data)).toMatchObject({
      success: true,
      warnings: [{ path: "schedules.0.assignments.1" }],
    });
  });

  it("checks transitive prerequisites, while explicitly typed reviews are exempt", () => {
    const data = candidate();
    data.content.topics.push({
      ...data.content.topics[0],
      topicId: "c04a7d28-501c-4e98-b7dd-f5f4b416267b",
      title: "Advanced",
      prerequisiteTopicIds: [data.content.topics[1].topicId],
    });
    data.content.tasks[2].topicId = data.content.topics[2].topicId;
    data.schedules[0].assignments[2] = {
      ...data.schedules[0].assignments[2],
      dayOffset: 0,
    };
    data.schedules[0].dailyCapacityMinutes = 90;
    expect(validatePackage(data).success).toBe(true);
    data.content.tasks[2].type = "learn";
    expect(
      errors(data).some(issue => issue.path === "schedules.0.assignments.2")
    ).toBe(true);
  });

  it("skips weekends for study-day offsets and permits visible workload overrides", () => {
    const data = candidate();
    data.schedules[0].startDate = "2026-10-16";
    data.schedules[0].milestonePlacements[0].date = "2026-10-20";
    data.schedules[0].dailyCapacityMinutes = 20;
    data.schedules[0].workloadOverrides = [
      "2026-10-16",
      "2026-10-19",
      "2026-10-20",
    ].map(date => ({ date, reason: "Explicit extra study time" }));
    expect(validatePackage(data)).toMatchObject({
      success: true,
      warnings: expect.any(Array),
    });
    data.schedules[0].dayBasis = "calendar-days";
    expect(errors(data).some(issue => issue.path.includes("assignments"))).toBe(
      true
    );
  });

  it("allows reference-only books and unassigned optional tasks", () => {
    const data = candidate();
    delete data.content.resources[0].url;
    data.content.resources[0].reference = "Private book, chapter 2";
    data.content.resources[0].accessStatus = "private";
    data.content.tasks[2].required = false;
    data.schedules[0].assignments.pop();
    expect(validatePackage(data).success).toBe(true);
  });

  it("keeps learner progress and ownership out of agent packages", () => {
    expect(
      errors({ ...fixture, progress: {}, accountId: fixture.packageId }).some(
        issue => issue.path === ""
      )
    ).toBe(true);
    expect(mutationSchema.safeParse({}).success).toBe(false);
  });

  it("validates completion timestamps separately from imported definitions", () => {
    const progress = {
      accountId: fixture.packageId,
      roadmapId: fixture.roadmap.roadmapId,
      taskId: fixture.content.tasks[0].taskId,
      state: "completed",
      completedAt: null,
      revision: 0,
    };
    expect(progressSchema.safeParse(progress).success).toBe(false);
    expect(
      progressSchema.safeParse({
        ...progress,
        completedAt: fixture.generatedAt,
      }).success
    ).toBe(true);
    expect(
      progressSchema.safeParse({ ...progress, state: "incomplete" }).success
    ).toBe(true);
  });

  it("requires scheduling incomplete baseline tasks but accepts completed prerequisites", () => {
    const data = candidate();
    data.importKind = "schedule";
    data.baseline = {
      revisionId: data.content.revisionId,
      scheduleId: data.packageId,
      taskIds: data.content.tasks.map(task => task.taskId),
      completedTaskIds: [],
      learnerRevision: 2,
    };
    data.schedules[0].assignments.shift();
    expect(
      errors(data).some(issue => issue.message.includes("unassigned"))
    ).toBe(true);
    data.baseline.completedTaskIds = [data.content.tasks[0].taskId];
    expect(validatePackage(data).success).toBe(true);
    data.baseline.completedTaskIds = [data.packageId];
    expect(
      errors(data).some(issue => issue.path === "baseline.completedTaskIds.0")
    ).toBe(true);
  });

  it("retains task identity for schedule-only changes and checks mapping references", () => {
    const data = candidate();
    data.importKind = "schedule";
    data.baseline = {
      revisionId: data.content.revisionId,
      scheduleId: data.packageId,
      taskIds: data.content.tasks.map(task => task.taskId),
      completedTaskIds: [],
      learnerRevision: 0,
    };
    expect(validatePackage(data).success).toBe(true);
    data.content.tasks[0].taskId = "5de1e26c-243e-4340-ae60-c660fa1f90a6";
    expect(
      errors(data).some(issue => issue.message.includes("retain the baseline"))
    ).toBe(true);
    const revision = candidate();
    revision.importKind = "revision";
    revision.baseline = {
      revisionId: revision.packageId,
      scheduleId: revision.roadmap.roadmapId,
      taskIds: [revision.content.tasks[0].taskId],
      completedTaskIds: [],
      learnerRevision: 0,
    };
    revision.content.predecessorRevisionId = revision.baseline.revisionId;
    revision.mappings = [
      {
        mappingId: "5de1e26c-243e-4340-ae60-c660fa1f90a6",
        oldTaskIds: [revision.content.tasks[0].taskId],
        newTaskIds: [revision.content.tasks[1].taskId],
        reason: "Split task",
        proposedCarryover: "none",
      },
    ];
    expect(validatePackage(revision).success).toBe(true);
    revision.mappings[0].oldTaskIds = [revision.roadmap.roadmapId];
    expect(
      errors(revision).some(issue => issue.path === "mappings.0.oldTaskIds.0")
    ).toBe(true);
  });
});

describe("reversible legacy migration staging", () => {
  it("pins all 76 existing checkpoints to distinct frozen IDs and original labels", () => {
    const current = tracks.flatMap(track =>
      track.tasks.map((task, index) => ({
        legacyTaskId: taskId(track, index),
        title: task[0],
      }))
    );
    expect(
      mapping.tasks.map(({ legacyTaskId, title }) => ({ legacyTaskId, title }))
    ).toEqual(current);
    expect(mapping.tasks).toHaveLength(76);
    expect(new Set(mapping.tasks.map(task => task.taskId)).size).toBe(76);
  });

  it("preserves complete backup bytes, notes, resources, dates, unknown fields and unmapped history", () => {
    const raw = readFileSync(
      fileURLToPath(
        new URL("../examples/legacy-progress.json", import.meta.url)
      ),
      "utf8"
    );
    const staged = prepareLegacyMigration(raw);
    expect(restoreLegacyBackup(staged)).toBe(raw);
    expect(staged.legacyState).toEqual(JSON.parse(raw).state);
    expect(
      staged.checkpointProgress.find(task => task.legacyTaskId === "python-1")
    ).toMatchObject({
      taskId: mapping.tasks[0].taskId,
      completed: true,
      legacyCompletedDate: "2026-10-09",
    });
    expect(
      staged.checkpointProgress.find(task => task.legacyTaskId === "retired-1")
    ).toMatchObject({ taskId: null, completed: true });
    expect(staged.warnings).toHaveLength(1);
    expect(prepareLegacyMigration(raw)).toEqual(staged);
  });

  it("rejects malformed legacy progress instead of silently replacing it", () => {
    expect(() =>
      prepareLegacyMigration('{"state":{"completed":{"python-1":"yes"}}}')
    ).toThrow();
    expect(() => prepareLegacyMigration("{}")).toThrow();
    expect(() => prepareLegacyMigration("{")).toThrow();
  });
});
