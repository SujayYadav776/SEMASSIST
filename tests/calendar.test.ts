import { expect, it, vi } from "vitest";
import { bootApp, byId, stored, STORAGE_KEY } from "./helpers";
import { calendarWeek, calendarMonth, normalizeCalendarEvents, normalizeCalendarTaskDates, calendarEntryForDay } from "../client/public/workspace-calendar.js";

it("handles week/month boundaries and preserves old sessions as all-day entries", () => {
  expect(calendarWeek("2026-01-01")).toEqual(["2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
  const event = { id: "session-good", title: " Study ", date: "2028-02-29", start: 1380, duration: 60 };
  expect(normalizeCalendarEvents([event])).toEqual([{ ...event, title: "Study", notes: "", trackId: "" }]);
  expect(normalizeCalendarEvents([null, { ...event, date: "2026-02-29" }, { ...event, id: 'bad"' }])).toEqual([]);
  expect(normalizeCalendarEvents([{ id: "session-new", title: "All day", date: "2028-02-29" }])).toHaveLength(1);
  const month = calendarMonth("2028-02-29");
  expect(month).toHaveLength(42);
  expect(month[0]).toBe("2028-01-31");
  expect(month).toContain("2028-02-29");
  expect(normalizeCalendarTaskDates({ "python-1": "2028-02-29", "java-1": null, "java-2": "2026-02-29", 'bad"': "2026-01-01" })).toEqual({ "python-1": "2028-02-29", "java-1": null });
});

function drag(doc: Document, type: string, element: Element) {
  const event = new doc.defaultView!.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { setData: vi.fn(), effectAllowed: "", dropEffect: "" } });
  element.dispatchEvent(event);
  return event;
}

it("moves sessions in week/month views, updates personal deadlines, and persists planned checkpoint dates", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  const state = app.loadState() as any;
  state.calendarEvents.push({ id: "session-drag", title: "Practice", date: app.todayKey(), start: 120, duration: 30, notes: "Keep this", trackId: "python" });
  state.customTasks.push({ id: "custom-drag", title: "Assignment", dueDate: null, completed: false });
  app.updateSummary(state);
  const date = doc.querySelectorAll<HTMLElement>(".calendar-all-day [data-calendar-drop]")[6].dataset.calendarDrop!;
  drag(doc, "dragstart", doc.querySelector('[data-calendar-event="session-drag"]')!);
  const target = doc.querySelector(`.calendar-all-day [data-calendar-drop="${date}"]`)!;
  expect(drag(doc, "dragover", target).defaultPrevented).toBe(true);
  expect(target.classList.contains("is-drop-target")).toBe(true);
  drag(doc, "drop", target);
  expect((stored(doc) as any).calendarEvents[0]).toMatchObject({ date, notes: "Keep this", start: 120, duration: 30 });
  expect(doc.querySelector(".is-drop-target")).toBeNull();
  drag(doc, "dragstart", doc.querySelector('[data-calendar-task="custom-drag"]')!);
  drag(doc, "drop", doc.querySelector(`.calendar-all-day [data-calendar-drop="${date}"]`)!);
  expect((stored(doc) as any).customTasks[0].dueDate).toBe(date);
  drag(doc, "dragstart", doc.querySelector('#calendarUndatedTasks [data-calendar-task="python-1"]')!);
  drag(doc, "drop", doc.querySelector(`.calendar-all-day [data-calendar-drop="${date}"]`)!);
  expect((stored(doc) as any).calendarTaskDates["python-1"]).toBe(date);
  expect(doc.querySelector(`.calendar-all-day [data-calendar-task="python-1"]`)).toBeTruthy();
  byId(doc, "calendarViewMonth")!.click();
  const monthTarget = doc.querySelectorAll<HTMLElement>(".calendar-month-cell")[40];
  const monthDate = monthTarget.dataset.calendarDrop!;
  drag(doc, "dragstart", doc.querySelector('[data-calendar-event="session-drag"]')!);
  drag(doc, "drop", monthTarget.querySelector("strong")!);
  expect((stored(doc) as any).calendarEvents[0].date).toBe(monthDate);
  const reload = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar", preSeed: { [STORAGE_KEY]: JSON.stringify(stored(doc)) } });
  expect((reload.app.loadState() as any).calendarTaskDates["python-1"]).toBe(date);
  drag(reload.doc, "dragstart", reload.doc.querySelector('[data-calendar-task="python-1"]')!);
  drag(reload.doc, "drop", reload.doc.querySelector('[data-calendar-drop="unscheduled"]')!);
  expect((stored(reload.doc) as any).calendarTaskDates["python-1"]).toBeNull();
  expect(reload.doc.querySelector('#calendarUndatedTasks [data-calendar-task="python-1"]')).toBeTruthy();
});

it("carries unfinished dated entries across month/leap boundaries without duplicating or rewriting assignments", () => {
  const entry = { id: "python-1", date: "2028-02-29", completed: false };
  expect(calendarEntryForDay(entry, "2028-03-01")).toMatchObject({ date: "2028-03-01", carriedFrom: "2028-02-29" });
  expect(calendarEntryForDay(entry, "2028-03-10")).toMatchObject({ date: "2028-03-10", carriedFrom: "2028-02-29" });
  expect(entry.date).toBe("2028-02-29");
  for (const value of [{ ...entry, completed: true }, { ...entry, date: "2028-03-12" }, { ...entry, date: null }]) {
    expect(calendarEntryForDay(value, "2028-03-10")).toMatchObject({ date: value.date, carriedFrom: null });
  }
});

it("shows carried sessions and checkpoints in soft red today and stops carrying completed entries", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  const today = app.todayKey(), past = "2020-01-01", state = app.loadState() as any;
  state.calendarEvents.push({ id: "session-late", title: "Overdue practice", date: past, notes: "", trackId: "" }, { id: "session-done", title: "Finished practice", date: past, completed: true });
  state.customTasks.push({ id: "custom-late", title: "Assignment", dueDate: past, completed: false });
  state.calendarTaskDates["python-1"] = past;
  state.calendarTaskDates["python-2"] = past;
  state.completed["python-2"] = true;
  app.updateSummary(state);
  const day = doc.querySelector(`.calendar-all-day [data-calendar-drop="${today}"]`)!;
  expect(day.querySelectorAll(".calendar-carried")).toHaveLength(3);
  expect(day.textContent).toContain(`Carried forward · assigned ${past}`);
  expect(day.querySelector('[data-calendar-task="python-2"]')).toBeNull();
  expect(day.querySelector('[data-calendar-event="session-done"]')).toBeNull();
  expect((app.loadState() as any).calendarTaskDates["python-1"]).toBe(past);
  byId(doc, "calendarViewMonth")!.click();
  expect(doc.querySelector(`[data-calendar-drop="${today}"]`)!.querySelectorAll(".calendar-carried")).toHaveLength(3);
  doc.querySelector<HTMLButtonElement>('[data-calendar-event="session-late"]')!.click();
  (byId(doc, "calendarEventCompleted") as HTMLInputElement).checked = true;
  byId(doc, "calendarForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  expect((stored(doc) as any).calendarEvents.find((entry: any) => entry.id === "session-late").completed).toBe(true);
  expect(doc.querySelector('[data-calendar-event="session-late"]')!.classList.contains("calendar-carried")).toBe(false);
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    vi.setSystemTime(tomorrow);
    doc.defaultView!.dispatchEvent(new doc.defaultView!.Event("focus"));
    expect(doc.querySelector(`[data-calendar-drop="${app.todayKey()}"]`)!.querySelectorAll(".calendar-carried")).toHaveLength(2);
    expect((app.loadState() as any).calendarTaskDates["python-1"]).toBe(past);
  } finally { vi.useRealTimers(); }
});

it("offers keyboard date planning, keeps roadmap source dates, and rejects external or unsaved drops", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  const frame = byId(doc, "roadmapsFrame") as HTMLIFrameElement;
  const roadmapId = "a754c0d1-6e9d-406d-9645-85eeea40f2e5", taskId = "9b4c61d2-32fe-4abc-99dd-529a42c8f956";
  doc.defaultView!.dispatchEvent(new doc.defaultView!.MessageEvent("message", { origin: "http://localhost:3000", source: frame.contentWindow, data: { type: "semassist-roadmaps-tracks", accountId: "demo", tracks: [{ id: roadmapId, name: "Roadmap", tasks: [{ id: taskId, label: "Read tuples", date: app.todayKey() }] }] } }));
  const id = `roadmap:${roadmapId}:${taskId}`;
  doc.querySelector<HTMLButtonElement>(`[data-calendar-plan="${id}"]`)!.click();
  expect(byId(doc, "calendarPlanNote")!.textContent).toContain(app.todayKey());
  (byId(doc, "calendarPlanDate") as HTMLInputElement).value = "2027-02-10";
  byId(doc, "calendarPlanForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  expect((stored(doc) as any).calendarTaskDates[id]).toBe("2027-02-10");
  doc.querySelector<HTMLButtonElement>(`[data-calendar-plan="${id}"]`)!.click();
  expect(byId(doc, "calendarPlanNote")!.textContent).toContain(app.todayKey());
  byId(doc, "calendarPlanClear")!.click();
  expect((stored(doc) as any).calendarTaskDates[id]).toBeNull();
  expect(doc.querySelector(`#calendarUndatedTasks [data-calendar-task="${id}"]`)).toBeTruthy();
  const target = doc.querySelector("#calendarBoard [data-calendar-drop]")!;
  drag(doc, "drop", target);
  expect((stored(doc) as any).calendarTaskDates[id]).toBeNull();
  const spy = vi.spyOn(doc.defaultView!.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota"); });
  try {
    drag(doc, "dragstart", doc.querySelector(`[data-calendar-task="${id}"]`)!);
    drag(doc, "drop", target);
    expect((app.loadState() as any).calendarTaskDates[id]).toBeNull();
    expect(byId(doc, "calendarMoveStatus")!.textContent).toContain("Could not save");
    expect(doc.querySelector(".is-dragging")).toBeNull();
  } finally { spy.mockRestore(); }
});

it("creates, edits, filters, searches, reloads and deletes saved study sessions", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  expect(byId(doc, "calendar")!.hidden).toBe(false);
  expect(byId(doc, "workbench")!.hidden).toBe(true);
  expect(doc.querySelectorAll(".calendar-day-head")).toHaveLength(7);
  byId(doc, "calendarNew")!.click();
  const set = (id: string, value: string) => { (byId(doc, id) as HTMLInputElement).value = value; };
  set("calendarEventTitle", '<img src=x> Python practice');
  set("calendarEventTrack", "python");
  const submit = () => byId(doc, "calendarForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  submit();
  expect(doc.querySelector("#calendarBoard img")).toBeNull();
  expect(doc.querySelectorAll(".calendar-session")).toHaveLength(1);
  expect((stored(doc)! as any).calendarEvents[0]).toMatchObject({ trackId: "python" });
  expect((stored(doc)! as any).calendarEvents[0].start).toBeUndefined();
  expect(doc.querySelector(".calendar-hours")).toBeNull();
  const filter = byId(doc, "calendarFilter") as HTMLSelectElement;
  filter.value = "java"; filter.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  expect(doc.querySelectorAll(".calendar-session")).toHaveLength(0);
  filter.value = "python"; filter.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  doc.querySelector<HTMLButtonElement>(".calendar-session")!.click();
  set("calendarEventTitle", "Practice decorators"); set("calendarEventDate", "2027-01-04"); submit();
  expect(byId(doc, "calendarRange")!.textContent).toContain("2027");
  byId(doc, "calendarToday")!.click();
  expect(doc.querySelectorAll(".calendar-session")).toHaveLength(0);
  filter.value = "java"; filter.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  byId(doc, "find")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>('[data-home-action="search"]')!.click();
  expect(byId(doc, "calendar")!.hidden).toBe(true);
  const search = byId(doc, "workspaceSearch") as HTMLInputElement;
  search.value = "decorators"; search.dispatchEvent(new doc.defaultView!.Event("input", { bubbles: true }));
  byId(doc, "calendar")!.scrollIntoView = vi.fn();
  [...doc.querySelectorAll<HTMLButtonElement>(".workspace-search-result")].find(button => button.textContent?.includes("Study session"))!.click();
  expect(doc.querySelectorAll(".calendar-session")).toHaveLength(1);
  expect((byId(doc, "calendarFilter") as HTMLSelectElement).value).toBe("");
  const reload = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar", preSeed: { [STORAGE_KEY]: JSON.stringify(stored(doc)) } });
  expect((reload.app.loadState() as any).calendarEvents).toHaveLength(1);
  (byId(reload.doc, "calendarMiniGrid")!.querySelector("button") as HTMLButtonElement).click();
  // Search jumps to the saved session's week after a fresh load.
  const input = byId(reload.doc, "workspaceSearch") as HTMLInputElement;
  input.value = "decorators"; input.dispatchEvent(new reload.doc.defaultView!.Event("input", { bubbles: true }));
  byId(reload.doc, "calendar")!.scrollIntoView = vi.fn();
  [...reload.doc.querySelectorAll<HTMLButtonElement>(".workspace-search-result")].find(button => button.textContent?.includes("Study session"))!.click();
  reload.doc.querySelector<HTMLButtonElement>(".calendar-session")!.click();
  byId(reload.doc, "calendarDelete")!.click();
  expect((stored(reload.doc)! as any).calendarEvents).toEqual([]);
  expect(app.getStats(app.loadState()).total).toBe(76);
});

it("switches between month and week schedules, navigates months safely and keeps scheduled content", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  byId(doc, "calendarNew")!.click();
  (byId(doc, "calendarEventTitle") as HTMLInputElement).value = "Month-end review";
  (byId(doc, "calendarEventDate") as HTMLInputElement).value = "2027-01-31";
  byId(doc, "calendarForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  byId(doc, "calendarViewMonth")!.click();
  expect(doc.querySelectorAll(".calendar-month-cell")).toHaveLength(42);
  expect(doc.querySelector('[aria-label="2027-01-31"]')!.textContent).toContain("Month-end review");
  expect(byId(doc, "calendarRailPeriod")!.textContent).toBe("This month");
  expect(byId(doc, "calendarViewMonth")!.getAttribute("aria-pressed")).toBe("true");
  byId(doc, "calendarNext")!.click();
  expect(byId(doc, "calendarRange")!.textContent).toMatch(/February.*2027/);
  byId(doc, "calendarPrevious")!.click();
  expect(byId(doc, "calendarRange")!.textContent).toMatch(/January.*2027/);
  byId(doc, "calendarViewWeek")!.click();
  expect(doc.querySelectorAll(".calendar-day-head")).toHaveLength(7);
  expect(doc.querySelectorAll(".calendar-month-cell")).toHaveLength(0);
  expect(doc.querySelector(".calendar-slot")).toBeNull();
  expect((app.loadState() as any).calendarEvents).toHaveLength(1);
});

it("shows dated tasks and projected roadmap checkpoints without inventing times, and retains a draft on quota failure", async () => {
  const { doc, app } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=calendar" });
  const state = app.loadState() as any;
  state.customTasks.push({ id: "custom-date", title: "Finish assignment", dueDate: app.todayKey(), cadence: "today", createdAt: app.todayKey(), completed: false });
  app.updateSummary(state);
  const frame = byId(doc, "roadmapsFrame") as HTMLIFrameElement;
  doc.defaultView!.dispatchEvent(new doc.defaultView!.MessageEvent("message", { origin: "http://localhost:3000", source: frame.contentWindow, data: { type: "semassist-roadmaps-tracks", accountId: "demo", tracks: [{ id: "a754c0d1-6e9d-406d-9645-85eeea40f2e5", name: "Python roadmap", tasks: [{ id: "9b4c61d2-32fe-4abc-99dd-529a42c8f956", label: "Read about tuples", date: app.todayKey() }] }] } }));
  expect(doc.querySelector(".calendar-all-day")!.textContent).toContain("Finish assignment");
  expect(doc.querySelector(".calendar-all-day")!.textContent).toContain("Read about tuples");
  expect(doc.querySelectorAll(".calendar-session")).toHaveLength(0);
  byId(doc, "calendarNew")!.click();
  (byId(doc, "calendarEventTitle") as HTMLInputElement).value = "Retain my draft";
  const spy = vi.spyOn(doc.defaultView!.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota"); });
  try {
    byId(doc, "calendarForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
    expect(byId(doc, "calendarDialog")!.hasAttribute("open")).toBe(true);
    expect(byId(doc, "calendarFormMessage")!.textContent).toContain("Could not save");
    expect((app.loadState() as any).calendarEvents).toEqual([]);
  } finally { spy.mockRestore(); }
});
