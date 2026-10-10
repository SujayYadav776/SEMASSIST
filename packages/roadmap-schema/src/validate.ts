import {
  DEFAULT_MAX_BYTES,
  packageSchema,
  type RoadmapPackage,
} from "./schema";

export interface ValidationIssue {
  path: string;
  message: string;
}
export type ValidationResult =
  | { success: true; data: RoadmapPackage; warnings: ValidationIssue[] }
  | { success: false; errors: ValidationIssue[] };

// UTC arithmetic represents date-only calendar days, not learner event times.
const dayNumber = (value: string) =>
  Date.parse(`${value}T00:00:00Z`) / 86400000;
const dateString = (day: number) => {
  const value = new Date(day * 86400000);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
};
const weekday = (day: number) => new Date(day * 86400000).getUTCDay() || 7;

export function validatePackage(input: unknown): ValidationResult {
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  const data = parsed.data;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const fail = (path: string, message: string) =>
    errors.push({ path, message });
  const seen = new Set<string>();
  const identity = (value: string, path: string) => {
    if (seen.has(value)) fail(path, "Duplicate ID");
    seen.add(value);
  };
  const unique = (values: readonly unknown[], path: string) => {
    if (new Set(values).size !== values.length) fail(path, "Duplicate values");
  };
  identity(data.packageId, "packageId");
  identity(data.roadmap.roadmapId, "roadmap.roadmapId");
  identity(data.content.revisionId, "content.revisionId");
  const topics = new Map(
    data.content.topics.map(topic => [topic.topicId, topic])
  );
  const tasks = new Map(data.content.tasks.map(task => [task.taskId, task]));
  const resources = new Set(
    data.content.resources.map(resource => resource.resourceId)
  );
  const milestones = new Set(
    data.content.milestones.map(milestone => milestone.milestoneId)
  );
  const refs = (
    values: string[],
    existing: { has(id: string): boolean },
    path: string
  ) => {
    unique(values, path);
    values.forEach((value, index) => {
      if (!existing.has(value)) fail(`${path}.${index}`, "Dangling reference");
    });
  };
  if (data.importKind === "new") {
    if (
      data.baseline ||
      data.content.predecessorRevisionId ||
      data.mappings.length
    )
      fail(
        "baseline",
        "New roadmaps cannot carry revision baselines or mappings"
      );
  } else if (!data.baseline)
    fail("baseline", "Revisions and schedules require a baseline");
  if (data.baseline) {
    unique(data.baseline.taskIds, "baseline.taskIds");
    refs(
      data.baseline.completedTaskIds,
      new Set(data.baseline.taskIds),
      "baseline.completedTaskIds"
    );
    if (data.importKind === "schedule") {
      if (
        data.content.revisionId !== data.baseline.revisionId ||
        data.mappings.length
      )
        fail(
          "content.revisionId",
          "Schedule-only changes reuse the baseline content revision without mappings"
        );
      if (
        !data.content.tasks.every(task =>
          data.baseline!.taskIds.includes(task.taskId)
        ) ||
        data.content.tasks.length !== data.baseline.taskIds.length
      )
        fail(
          "content.tasks",
          "Schedule-only changes must retain the baseline task IDs"
        );
    } else if (
      data.importKind === "revision" &&
      (data.content.predecessorRevisionId !== data.baseline.revisionId ||
        data.content.revisionId === data.baseline.revisionId)
    )
      fail(
        "content.predecessorRevisionId",
        "A revision needs a new ID and the baseline as its predecessor"
      );
    if (
      data.schedules.some(
        schedule => schedule.scheduleId === data.baseline!.scheduleId
      )
    )
      fail(
        "schedules",
        "A candidate must not overwrite the baseline schedule ID"
      );
  }
  data.content.resources.forEach((resource, index) => {
    const path = `content.resources.${index}`;
    identity(resource.resourceId, `${path}.resourceId`);
    if (!resource.url && !resource.reference)
      fail(path, "Provide an external URL or a bibliographic reference");
    if (!resource.provenance.accessed && resource.provenance.accessedAt)
      fail(
        `${path}.provenance.accessedAt`,
        "Unaccessed sources cannot claim an access timestamp"
      );
  });
  data.content.topics.forEach((topic, index) => {
    const path = `content.topics.${index}`;
    identity(topic.topicId, `${path}.topicId`);
    refs(topic.prerequisiteTopicIds, topics, `${path}.prerequisiteTopicIds`);
    refs(topic.resourceIds, resources, `${path}.resourceIds`);
  });
  // Iterative traversal also handles long dependency chains without stack overflow.
  const remaining = new Map(
    data.content.topics.map(topic => [
      topic.topicId,
      new Set(topic.prerequisiteTopicIds).size,
    ])
  );
  const dependents = new Map<string, string[]>();
  data.content.topics.forEach(topic =>
    topic.prerequisiteTopicIds.forEach(prerequisite => {
      const list = dependents.get(prerequisite) ?? [];
      list.push(topic.topicId);
      dependents.set(prerequisite, list);
    })
  );
  const queue = [...remaining]
    .filter(([, count]) => count === 0)
    .map(([id]) => id);
  for (let index = 0; index < queue.length; index++) {
    for (const next of dependents.get(queue[index]) ?? []) {
      remaining.set(next, remaining.get(next)! - 1);
      if (remaining.get(next) === 0) queue.push(next);
    }
  }
  if (queue.length !== topics.size)
    fail("content.topics", "Dependency cycle or unresolved prerequisite");
  data.content.tasks.forEach((task, index) => {
    const path = `content.tasks.${index}`;
    identity(task.taskId, `${path}.taskId`);
    if (!topics.has(task.topicId))
      fail(`${path}.topicId`, "Dangling topic reference");
    refs(task.resourceIds, resources, `${path}.resourceIds`);
  });
  data.schedules.forEach((schedule, index) => {
    const path = `schedules.${index}`;
    identity(schedule.scheduleId, `${path}.scheduleId`);
    if (schedule.revisionId !== data.content.revisionId)
      fail(
        `${path}.revisionId`,
        "Schedule references a different content revision"
      );
    try {
      new Intl.DateTimeFormat("en", { timeZone: schedule.timezone });
    } catch {
      fail(`${path}.timezone`, "Invalid IANA timezone");
    }
    if (schedule.durationSemantics === "additional" && !data.baseline)
      fail(
        `${path}.durationSemantics`,
        "Additional days require a prior-plan baseline"
      );
    unique(schedule.studyDays, `${path}.studyDays`);
    const start = dayNumber(schedule.startDate);
    const eligible: number[] = [];
    let end = start;
    if (schedule.dayBasis === "calendar-days") {
      end = start + schedule.length - 1;
      for (let day = start; day <= end; day++)
        if (schedule.studyDays.includes(weekday(day))) eligible.push(day);
    } else {
      for (let day = start; eligible.length < schedule.length; day++) {
        if (schedule.studyDays.includes(weekday(day))) eligible.push(day);
        end = day;
      }
    }
    const eligibleSet = new Set(eligible);
    const placed = new Set<string>();
    schedule.milestonePlacements.forEach((placement, placementIndex) => {
      const at = `${path}.milestonePlacements.${placementIndex}`;
      if (!milestones.has(placement.milestoneId))
        fail(`${at}.milestoneId`, "Dangling milestone reference");
      if (placed.has(placement.milestoneId))
        fail(`${at}.milestoneId`, "Milestone placed twice in one schedule");
      placed.add(placement.milestoneId);
      if (!eligibleSet.has(dayNumber(placement.date)))
        fail(`${at}.date`, "Milestone needs an eligible schedule date");
    });
    const workload = new Map<string, number>();
    const taskDays = new Map<string, number>();
    const dated: {
      day: number;
      taskId: string;
      override?: string;
      index: number;
    }[] = [];
    schedule.assignments.forEach((assignment, assignmentIndex) => {
      const at = `${path}.assignments.${assignmentIndex}`;
      identity(assignment.assignmentId, `${at}.assignmentId`);
      const task = tasks.get(assignment.taskId);
      if (!task) {
        fail(`${at}.taskId`, "Dangling task reference");
        return;
      }
      if (taskDays.has(task.taskId))
        fail(
          `${at}.taskId`,
          "Task assigned twice in one schedule; use a separate review task for repetition"
        );
      const day =
        "date" in assignment
          ? dayNumber(assignment.date)
          : schedule.dayBasis === "study-days"
            ? eligible[assignment.dayOffset]
            : start + assignment.dayOffset;
      if (
        day === undefined ||
        day < start ||
        day > end ||
        !eligibleSet.has(day)
      ) {
        fail(at, "Assignment is outside the schedule or on a non-study day");
        return;
      }
      taskDays.set(task.taskId, day);
      const key = dateString(day);
      workload.set(key, (workload.get(key) ?? 0) + task.minutes);
      dated.push({
        day,
        taskId: task.taskId,
        override: assignment.overrideReason,
        index: assignmentIndex,
      });
    });
    const overrides = new Set<string>();
    schedule.workloadOverrides.forEach((override, overrideIndex) => {
      if (
        overrides.has(override.date) ||
        !eligibleSet.has(dayNumber(override.date))
      )
        fail(
          `${path}.workloadOverrides.${overrideIndex}.date`,
          "Duplicate or out-of-schedule override"
        );
      overrides.add(override.date);
    });
    workload.forEach((minutes, day) => {
      if (minutes <= schedule.dailyCapacityMinutes) return;
      const issue = {
        path: `${path}.assignments`,
        message: `${day}: ${minutes} minutes exceeds capacity ${schedule.dailyCapacityMinutes}`,
      };
      if (overrides.has(day)) warnings.push(issue);
      else errors.push(issue);
    });
    const currentTasks = new Set(data.content.tasks.map(task => task.taskId));
    const retained = new Set(
      data.baseline?.completedTaskIds.filter(id => currentTasks.has(id)) ?? []
    );
    data.content.tasks.forEach(task => {
      if (
        task.required &&
        !taskDays.has(task.taskId) &&
        !retained.has(task.taskId)
      )
        fail(
          `${path}.assignments`,
          `Required new task ${task.taskId} is unassigned`
        );
    });
    dated.forEach(assignment => {
      const task = tasks.get(assignment.taskId)!;
      if (task.type !== "learn") return;
      const pending = [
        ...(topics.get(task.topicId)?.prerequisiteTopicIds ?? []),
      ];
      const ancestors = new Set<string>();
      while (pending.length) {
        const ancestor = pending.pop()!;
        if (ancestors.has(ancestor)) continue;
        ancestors.add(ancestor);
        pending.push(...(topics.get(ancestor)?.prerequisiteTopicIds ?? []));
      }
      const unmet = [...ancestors].some(topicId => {
        const learning = data.content.tasks.filter(
          task => task.topicId === topicId && task.type === "learn"
        );
        return (
          !learning.length ||
          learning.some(
            task =>
              !retained.has(task.taskId) &&
              (taskDays.get(task.taskId) === undefined ||
                taskDays.get(task.taskId)! >= assignment.day)
          )
        );
      });
      if (unmet) {
        const issue = {
          path: `${path}.assignments.${assignment.index}`,
          message:
            "Prerequisite learning must be scheduled on an earlier date; document an override for prior knowledge",
        };
        if (assignment.override) warnings.push(issue);
        else errors.push(issue);
      }
    });
  });
  data.content.milestones.forEach((milestone, index) => {
    const path = `content.milestones.${index}`;
    identity(milestone.milestoneId, `${path}.milestoneId`);
    refs(milestone.taskIds, tasks, `${path}.taskIds`);
    refs(milestone.topicIds, topics, `${path}.topicIds`);
    if (!milestone.taskIds.length && !milestone.topicIds.length)
      fail(path, "Milestones must reference tasks or topics");
  });
  const oldTasks = new Set(data.baseline?.taskIds ?? []);
  data.mappings.forEach((mapping, index) => {
    const path = `mappings.${index}`;
    identity(mapping.mappingId, `${path}.mappingId`);
    refs(mapping.oldTaskIds, oldTasks, `${path}.oldTaskIds`);
    refs(mapping.newTaskIds, tasks, `${path}.newTaskIds`);
  });
  return errors.length
    ? { success: false, errors }
    : { success: true, data, warnings };
}

export function parsePackageJson(
  raw: string,
  maxBytes = DEFAULT_MAX_BYTES
): ValidationResult {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new RangeError("maxBytes must be a positive safe integer");
  if (new TextEncoder().encode(raw).byteLength > maxBytes)
    return {
      success: false,
      errors: [{ path: "$", message: `Package exceeds ${maxBytes} bytes` }],
    };
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return { success: false, errors: [{ path: "$", message: "Invalid JSON" }] };
  }
  return validatePackage(input);
}
