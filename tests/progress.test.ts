import { expect, it, vi } from "vitest";
import { bootApp, byId } from "./helpers";
import { buildSkillMetrics, progressSeries } from "../client/public/workspace-progress.js";

it("scores real checkpoints, combines Python paths, separates recall evidence and handles empty tracks", () => {
  const state = { completed: { "python-1": true, "python30-1": true, "java-1": true }, reviews: { "python-1@3": "2026-10-10", "python-2@3": "2026-10-10", "java-1@3": "invalid" } };
  const tracks = [{ id: "python", name: "Python", tasks: [["One"], ["Two"]] }, { id: "python30", name: "30 Days of Python", tasks: [["Three"]] }, { id: "java", name: "Java", tasks: [["Java"]] }, { id: "empty", name: "Empty", tasks: [] }];
  const roadmaps = [{ id: "roadmap:one", roadmapId: "one", name: "Roadmap skill", tasks: [{ sourceTaskId: "task", label: "Roadmap checkpoint", completed: false }] }];
  const skills = buildSkillMetrics(state, tracks, roadmaps, (track, index) => `${track.id}-${index + 1}`);
  expect(skills).toHaveLength(4);
  expect(skills[0]).toMatchObject({ name: "Python", score: 67, total: 3, done: 2, recalled: 1, next: { title: "Two", task: "python-2" } });
  expect(skills[1]).toMatchObject({ score: 100, recalled: 0 });
  expect(skills[2]).toMatchObject({ score: null });
  expect(skills[3]).toMatchObject({ score: 0, next: { roadmap: "one", task: "task" } });
});

it("builds bounded-date activity/focus series with no future or invented data", () => {
  const series = progressSeries({ activity: { "2026-10-14": 3, "2026-10-16": 100, "2026-10-15": -4 }, focus: { days: { "2026-10-14": 25, "2026-10-15": "invalid" } } }, "2026-10-15", 7);
  expect(series).toHaveLength(7);
  expect(series[0].date).toBe("2026-10-09");
  expect(series[5]).toEqual({ date: "2026-10-14", actions: 3, minutes: 25 });
  expect(series[6]).toEqual({ date: "2026-10-15", actions: 0, minutes: 0 });
  expect(series.reduce((sum, day) => sum + day.actions, 0)).toBe(3);
});

it("opens the metrics page, updates from completions/roadmap projections and navigates next checkpoints", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=progress" });
  expect(byId(doc, "progress")!.hidden).toBe(false);
  expect(byId(doc, "overview")!.hidden).toBe(true);
  expect(doc.querySelectorAll(".insights-skill")).toHaveLength(5);
  expect(byId(doc, "insightsGauge")!.textContent).toContain("0/100");
  const state = app.loadState() as any;
  const python = app.tracks.find((track: any) => track.id === "python");
  const id = app.taskId(python, 0);
  state.completed[id] = true;
  state.reviews[`${id}@3`] = app.todayKey();
  state.activity[app.todayKey()] = 1;
  state.focus.days[app.todayKey()] = 25;
  app.updateSummary(state);
  expect(doc.querySelector('.insights-skill [aria-label="Python progress"]')!.getAttribute("aria-valuenow")).not.toBe("0");
  expect(byId(doc, "insightsMetrics")!.textContent).toContain("25m");
  expect(byId(doc, "insightsMetrics")!.textContent).toContain("Recall evidence1");
  const frame = byId(doc, "roadmapsFrame") as HTMLIFrameElement;
  doc.defaultView!.dispatchEvent(new doc.defaultView!.MessageEvent("message", { origin: "http://localhost:3000", source: frame.contentWindow, data: { type: "semassist-roadmaps-tracks", accountId: "demo", tracks: [{ id: "a754c0d1-6e9d-406d-9645-85eeea40f2e5", name: '<img src=x> Study plan', tasks: [{ id: "9b4c61d2-32fe-4abc-99dd-529a42c8f956", label: "Plan practice", completed: true }] }] } }));
  expect(doc.querySelectorAll(".insights-skill")).toHaveLength(6);
  expect(doc.querySelector("#progress img")).toBeNull();
  expect(byId(doc, "insightsSkills")!.textContent).toContain("All checkpoints verified");
  const period = byId(doc, "insightsPeriod") as HTMLSelectElement;
  period.value = "7"; period.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  expect(doc.querySelector("#insightsFocusChart svg")!.getAttribute("aria-label")).toContain("7 days");
  const radarLabel = doc.querySelector("#insightsRadar svg")!.getAttribute("aria-label");
  doc.querySelector<HTMLButtonElement>('[data-filter="done"]')!.click();
  byId(doc, "checkpoint")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>('[data-insights-skill="python"]')!.click();
  expect(doc.body.dataset.workspacePage).toBe("checkpoint");
  expect(byId(doc, "checkpointDetail")!.textContent).toContain("Control flow");
  doc.querySelector<HTMLInputElement>("[data-checkpoint-complete]")!.click();
  expect((app.loadState() as any).completed["python-2"]).toBe(true);
  doc.querySelector<HTMLButtonElement>("[data-checkpoint-back]")!.click();
  expect(doc.body.dataset.workspacePage).toBe("overview");
  expect(byId(doc, "activity")!.contains(byId(doc, "homeSkillRadar"))).toBe(true);
  expect(doc.querySelector("#homeSkillRadar svg")!.getAttribute("aria-label")).not.toBe(radarLabel);
  expect(doc.querySelector("#homeSkillRadar img")).toBeNull();
  byId(doc, "progress")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>('.home-skill-heading [data-scroll="progress"]')!.click();
  expect(doc.body.dataset.workspacePage).toBe("progress");
  expect(doc.querySelector("#insightsRadar svg")!.getAttribute("aria-label")).toBe(doc.querySelector("#homeSkillRadar svg")!.getAttribute("aria-label"));
});
