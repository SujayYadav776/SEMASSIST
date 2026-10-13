import { describe, expect, it } from "vitest";
import fixture from "../examples/beginner-python.json";
import { compareItems, workloadSummary } from "../client/roadmaps/diff";
import type { RoadmapPackage } from "../packages/roadmap-schema/src/index";

describe("roadmap import preview", () => {
  it("reports additions, removals, and changed fields by stable identity", () => {
    const changes = compareItems(
      [{ taskId: "one", title: "Basics", minutes: 30 }, { taskId: "two", title: "Loops", minutes: 20 }],
      [{ taskId: "one", title: "Basics", minutes: 45 }, { taskId: "three", title: "Functions", minutes: 25 }]
    );
    expect(changes).toEqual([
      { id: "one", title: "Basics", kind: "changed", fields: ["minutes"] },
      { id: "two", title: "Loops", kind: "removed", fields: [] },
      { id: "three", title: "Functions", kind: "added", fields: [] },
    ]);
  });

  it("summarizes assigned minutes and capacity from the proposed schedule", () => {
    const summary = workloadSummary(fixture as RoadmapPackage);
    expect(summary).toEqual({ days: 3, totalMinutes: 90, peakMinutes: 30, overCapacityDays: 0, capacityMinutes: 45 });
  });
});
