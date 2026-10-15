import { expect, it, vi } from "vitest";
import { bootApp, byId, STORAGE_KEY, stored } from "./helpers";

it("saves projects, changes status, finds them, reloads and deletes without altering checkpoint totals", async () => {
  const { doc, app } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1" });
  const totals = app.getStats(app.loadState());
  (byId(doc, "projectName") as HTMLInputElement).value = '<img src=x onerror=alert(1)> Planner';
  (byId(doc, "projectDescription") as HTMLInputElement).value = "Python study planner";
  byId(doc, "projectForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  expect(doc.querySelector("#projectList img")).toBeNull();
  const state = stored(doc)! as any;
  expect(state.projects).toHaveLength(1);
  const select = doc.querySelector<HTMLSelectElement>("[data-project-status]")!;
  select.value = "completed";
  select.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  expect(byId(doc, "projectCount")!.textContent).toContain("1 completed");
  expect(app.getStats(app.loadState())).toEqual(totals);
  const search = byId(doc, "workspaceSearch") as HTMLInputElement;
  search.value = "study planner";
  search.dispatchEvent(new doc.defaultView!.Event("input", { bubbles: true }));
  byId(doc, "projects")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>(".workspace-search-result")!.click();
  expect(byId(doc, "projects")!.hidden).toBe(false);
  const saved = JSON.stringify(stored(doc));
  const reload = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=learning", preSeed: { [STORAGE_KEY]: saved } });
  expect(byId(reload.doc, "projects")!.hidden).toBe(true);
  expect(reload.doc.querySelector<HTMLSelectElement>("[data-project-status]")!.value).toBe("completed");
  byId(reload.doc, "projects")!.scrollIntoView = vi.fn();
  reload.doc.querySelector<HTMLButtonElement>('[data-scroll="projects"]')!.click();
  expect(byId(reload.doc, "projects")!.hidden).toBe(false);
  reload.doc.querySelector<HTMLButtonElement>("[data-project-delete]")!.click();
  expect((stored(reload.doc)! as any).projects).toEqual([]);
  expect(byId(reload.doc, "projectEmpty")!.hidden).toBe(false);
});

it("normalizes imported projects and retains the draft and prior state if storage is full", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1" });
  expect((app.normalizeState({ projects: [null, { id: 'bad"', name: "Bad" }, { id: "project-good", name: " Good ", status: "constructor" }, { id: "project-good", name: "Duplicate" }] }) as any).projects).toEqual([{ id: "project-good", name: "Good", description: "", status: "planned" }]);
  expect((app.normalizeState({}) as any).projects).toEqual([]);
  (byId(doc, "projectName") as HTMLInputElement).value = "Keep this draft";
  const previous = app.loadState();
  const storageSpy = vi.spyOn(doc.defaultView!.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
  try {
    byId(doc, "projectForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
    expect(app.loadState()).toEqual(previous);
    expect(byId(doc, "projectMessage")!.textContent).toContain("Could not save");
    expect((byId(doc, "projectName") as HTMLInputElement).value).toBe("Keep this draft");
    expect(doc.querySelectorAll(".project-row")).toHaveLength(0);
  } finally { storageSpy.mockRestore(); }
});
