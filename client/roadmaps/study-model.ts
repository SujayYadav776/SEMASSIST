import type { RoadmapPackage, LearnerRecord } from "../../packages/roadmap-schema/src/index";
export type Records = Record<string, LearnerRecord>;
export const recordKey = (kind: string, id: string) => `${kind}:${id}`;
export const isCompleted = (records: Records, id: string) => records[recordKey("completion", id)]?.data.state === "completed";
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function todayKey(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate() + days); return dateKey(date);
}
export function scheduleDates(schedule: RoadmapPackage["schedules"][number]) {
  const eligible: string[] = [];
  for (let day = 0; schedule.dayBasis === "calendar-days" ? day < schedule.length : eligible.length < schedule.length; day++) {
    const date = addDays(schedule.startDate, day);
    if (schedule.studyDays.includes(new Date(`${date}T12:00:00`).getDay() || 7)) eligible.push(date);
  }
  return eligible;
}
export function assignedDate(schedule: RoadmapPackage["schedules"][number], assignment: RoadmapPackage["schedules"][number]["assignments"][number], records: Records) {
  const moved = records[recordKey("assignment", assignment.assignmentId)]?.data;
  if (moved?.scheduleId === schedule.scheduleId && typeof moved.date === "string") return moved.date;
  return "date" in assignment ? assignment.date : schedule.dayBasis === "study-days" ? scheduleDates(schedule)[assignment.dayOffset] : addDays(schedule.startDate, assignment.dayOffset);
}
export function requiredProgress(value: RoadmapPackage, records: Records) {
  const tasks = value.content.tasks.filter(task => task.required);
  const completed = tasks.filter(task => isCompleted(records, task.taskId)).length;
  return { completed, total: tasks.length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : null };
}
export function topicGraph(topics: RoadmapPackage["content"]["topics"]) {
  const levels = new Map<string, number>();
  while (levels.size < topics.length) {
    let advanced = false;
    for (const topic of topics) if (!levels.has(topic.topicId) && topic.prerequisiteTopicIds.every(id => levels.has(id))) {
      levels.set(topic.topicId, Math.max(-1, ...topic.prerequisiteTopicIds.map(id => levels.get(id)!)) + 1); advanced = true;
    }
    if (!advanced) throw new Error("Topic graph contains an unresolved dependency");
  }
  const slots = new Map<number, number>();
  return topics.map(topic => { const level = levels.get(topic.topicId)!; const slot = slots.get(level) ?? 0; slots.set(level, slot + 1); return { topic, x: level * 240, y: slot * 140 }; });
}
export function scheduleWarnings(value: RoadmapPackage, schedule: RoadmapPackage["schedules"][number], records: Records) {
  const dates = new Map(schedule.assignments.map(a => [a.taskId, assignedDate(schedule, a, records)]));
  const workload = new Map<string, number>();
  const warnings: string[] = [];
  const eligible = new Set(scheduleDates(schedule));
  for (const task of value.content.tasks) {
    const date = dates.get(task.taskId); if (!date) continue;
    workload.set(date, (workload.get(date) ?? 0) + task.minutes);
    if (!eligible.has(date)) warnings.push(`${task.title}: ${date} is outside the eligible study dates.`);
    if (task.type !== "learn") continue;
    const pending = [...(value.content.topics.find(t => t.topicId === task.topicId)?.prerequisiteTopicIds ?? [])];
    const ancestors = new Set<string>();
    while (pending.length) { const id = pending.pop()!; if (ancestors.has(id)) continue; ancestors.add(id); pending.push(...(value.content.topics.find(t => t.topicId === id)?.prerequisiteTopicIds ?? [])); }
    const unmet = value.content.tasks.some(t => ancestors.has(t.topicId) && t.required && t.type === "learn" && !isCompleted(records, t.taskId) && (!dates.get(t.taskId) || dates.get(t.taskId)! >= date));
    if (unmet) warnings.push(`${task.title}: prerequisite learning is not scheduled earlier or completed.`);
  }
  workload.forEach((minutes, date) => { if (minutes > schedule.dailyCapacityMinutes) warnings.push(`${date}: ${minutes} min exceeds ${schedule.dailyCapacityMinutes} min capacity.`); });
  return { warnings, workload };
}
