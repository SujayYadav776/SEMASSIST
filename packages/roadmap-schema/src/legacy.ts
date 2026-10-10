import { z } from "zod";
import mapping from "../legacy-task-map.json";
import { DEFAULT_MAX_BYTES } from "./schema";

const legacyStateSchema = z.looseObject({
  completed: z.record(z.string(), z.boolean()),
  completedAt: z.record(z.string(), z.iso.date()).optional(),
  activity: z.record(z.string(), z.number().nonnegative()).optional(),
  customTasks: z.array(z.unknown()).optional(),
  resources: z.array(z.unknown()).optional(),
});

/** Pure staging only: no cloud writes, localStorage writes, or progress inference. */
export function prepareLegacyMigration(raw: string) {
  if (new TextEncoder().encode(raw).byteLength > DEFAULT_MAX_BYTES)
    throw new Error("Legacy backup exceeds 5 MiB");
  const parsed: unknown = JSON.parse(raw);
  const envelope = z.record(z.string(), z.unknown()).parse(parsed);
  const state = legacyStateSchema.parse(
    "state" in envelope ? envelope.state : envelope
  );
  const taskIds = new Set([
    ...Object.keys(state.completed),
    ...Object.keys(state.completedAt ?? {}),
  ]);
  const checkpointProgress = [...taskIds].map(legacyTaskId => ({
    legacyTaskId,
    taskId:
      mapping.tasks.find(task => task.legacyTaskId === legacyTaskId)?.taskId ??
      null,
    completed: state.completed[legacyTaskId] ?? false,
    // A legacy date has no time/zone: preserve it instead of inventing a UTC time.
    legacyCompletedDate: state.completedAt?.[legacyTaskId] ?? null,
  }));
  return {
    migrationVersion: "1.0.0",
    originalBackupJson: raw,
    legacyState: state,
    checkpointProgress,
    warnings: checkpointProgress
      .filter(task => !task.taskId)
      .map(
        task => `Unmapped checkpoint retained for review: ${task.legacyTaskId}`
      ),
  };
}

export function restoreLegacyBackup(
  snapshot: ReturnType<typeof prepareLegacyMigration>
) {
  return snapshot.originalBackupJson;
}
