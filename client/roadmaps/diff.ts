import type { RoadmapPackage } from "../../packages/roadmap-schema/src/index";
import { assignedDate } from "./study-model";

export type Change = { id: string; title: string; kind: "added" | "removed" | "changed"; fields: string[] };

export function compareItems<T extends { topicId?: string; taskId?: string; resourceId?: string; milestoneId?: string; title: string }>(before: T[], after: T[]): Change[] {
  const key = (item: T) => item.topicId ?? item.taskId ?? item.resourceId ?? item.milestoneId ?? item.title;
  const oldItems = new Map(before.map(item => [key(item), item]));
  const newItems = new Map(after.map(item => [key(item), item]));
  const changes: Change[] = [];
  for (const [id, item] of oldItems) {
    const next = newItems.get(id);
    if (!next) changes.push({ id, title: item.title, kind: "removed", fields: [] });
    else {
      const fields = [...new Set([...Object.keys(item), ...Object.keys(next)])].filter(field => JSON.stringify(item[field as keyof T]) !== JSON.stringify(next[field as keyof T]));
      if (fields.length) changes.push({ id, title: next.title, kind: "changed", fields });
    }
  }
  for (const [id, item] of newItems) if (!oldItems.has(id)) changes.push({ id, title: item.title, kind: "added", fields: [] });
  return changes;
}

export function workloadSummary(value: RoadmapPackage) {
  const tasks = new Map(value.content.tasks.map(task => [task.taskId, task.minutes]));
  const days = new Map<string, number>();
  for (const assignment of value.schedules[0].assignments) {
    const day = assignedDate(value.schedules[0], assignment, {});
    days.set(day, (days.get(day) ?? 0) + (tasks.get(assignment.taskId) ?? 0));
  }
  const schedule = value.schedules[0];
  const minutes = [...days.values()];
  return {
    days: days.size,
    totalMinutes: minutes.reduce((sum, day) => sum + day, 0),
    peakMinutes: Math.max(0, ...minutes),
    overCapacityDays: minutes.filter(day => day > schedule.dailyCapacityMinutes).length,
    capacityMinutes: schedule.dailyCapacityMinutes,
  };
}
