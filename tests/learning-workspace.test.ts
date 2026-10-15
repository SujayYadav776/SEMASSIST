import { afterEach, expect, it, vi } from "vitest";
import { bootApp, byId, makeFakeSupabase, STORAGE_KEY, stored } from "./helpers";

afterEach(() => vi.restoreAllMocks());

function createTrack(doc: Document, name = "Web design", topics = "Semantic HTML\nAccessible layouts") {
  (byId(doc, "trackName") as HTMLInputElement).value = name;
  (byId(doc, "trackDescription") as HTMLInputElement).value = "Build inclusive websites";
  (byId(doc, "trackTopics") as HTMLTextAreaElement).value = topics;
  byId(doc, "learningTrackForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
}
function search(doc: Document, query: string) {
  const input = byId(doc, "workspaceSearch") as HTMLInputElement;
  input.value = query;
  input.dispatchEvent(new doc.defaultView!.Event("input", { bubbles: true }));
  return [...doc.querySelectorAll<HTMLButtonElement>(".workspace-search-result")];
}

it("creates a personal track with a selected icon, checkpoints, real progress and persistent sidebar visibility", async () => {
  const { doc, app } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=learning" });
  expect(doc.querySelectorAll("[data-track-icon]")).toHaveLength(32);
  doc.querySelector<HTMLButtonElement>('[data-track-icon="Rocket"]')!.click();
  (byId(doc, "trackShowSidebar") as HTMLInputElement).checked = true;
  createTrack(doc);
  const state = stored(doc)! as any;
  const track = state.learningTracks[0];
  expect(track.tasks).toHaveLength(2);
  expect(state.trackSettings[track.id]).toMatchObject({ icon: "Rocket", showInSidebar: true });
  expect(doc.querySelector(`#trackNavigation [data-scroll="${track.id}"]`)?.textContent).toContain("Web design");
  expect(doc.querySelector(`#homeTracks [data-inspect-track="${track.id}"]`)?.textContent).toContain("Web design");
  expect(doc.querySelector(`[data-task-id="${track.id}-1"]`)?.textContent).toContain("Semantic HTML");
  const focus = byId(doc, "queueFocus") as HTMLSelectElement;
  focus.value = track.id;
  focus.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
  expect(doc.querySelector("#missionQueue .queue-row")?.textContent).toContain("Semantic HTML");
  byId(doc, track.id)!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>(`#trackNavigation [data-scroll="${track.id}"]`)!.click();
  doc.querySelector<HTMLInputElement>(`[data-task-id="${track.id}-1"] input`)!.click();
  expect(doc.querySelector(`#trackNavigation [data-scroll="${track.id}"]`)!.getAttribute("aria-current")).toBe("page");
  expect(app.getStats(stored(doc))).toMatchObject({ total: 78, done: 1 });
  expect(String(app.buildSemesterReport(stored(doc)))).toContain("Web design");
  const saved = JSON.stringify(stored(doc));
  const reload = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1", preSeed: { [STORAGE_KEY]: saved } });
  expect(reload.doc.querySelector(`#trackNavigation [data-scroll="${track.id}"]`)).not.toBeNull();
  expect(reload.doc.querySelector<HTMLInputElement>(`[data-task-id="${track.id}-1"] input`)!.checked).toBe(true);
  reload.doc.querySelector<HTMLInputElement>(`[data-track-sidebar="${track.id}"]`)!.click();
  expect(reload.doc.querySelector(`#trackNavigation [data-scroll="${track.id}"]`)).toBeNull();
  expect(reload.doc.querySelector(`#homeTracks [data-inspect-track="${track.id}"]`)).not.toBeNull();
});

it("resizes an uploaded cover and saves it into the manager and dashboard without changing checkpoint identity", async () => {
  const { doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=learning" });
  const win = doc.defaultView!;
  const cover = "data:image/jpeg;base64,/9j/2Q==";
  class DecodedImage {
    naturalWidth = 1440;
    naturalHeight = 960;
    onload: (() => void) | undefined;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  }
  Object.defineProperty(win, "Image", { value: DecodedImage, configurable: true });
  const drawImage = vi.fn();
  vi.spyOn(win.HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), drawImage } as any);
  vi.spyOn(win.HTMLCanvasElement.prototype, "toDataURL").mockImplementation(function (this: HTMLCanvasElement) {
    expect(this.width).toBe(720);
    expect(this.height).toBe(480);
    return cover;
  });
  const upload = byId(doc, "trackCover") as HTMLInputElement;
  Object.defineProperty(upload, "files", { value: [new win.File([new Uint8Array([137, 80, 78, 71])], "cover.png", { type: "image/png" })] });
  upload.dispatchEvent(new win.Event("change", { bubbles: true }));
  await vi.waitFor(() => expect(byId(doc, "trackFormMessage")!.textContent).toContain("Cover ready"));
  createTrack(doc);
  const state = stored(doc)! as any;
  const track = state.learningTracks[0];
  expect(state.trackSettings[track.id].cover).toBe(cover);
  expect(doc.querySelector<HTMLImageElement>(`#homeTracks [data-inspect-track="${track.id}"] img`)!.src).toBe(cover);
  expect(drawImage).toHaveBeenCalled();
  byId(doc, "learningTrackForm")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>(`[data-customize-track="${track.id}"]`)!.click();
  doc.querySelector<HTMLButtonElement>('[data-track-icon="Atom"]')!.click();
  byId(doc, "trackRemoveCover")!.click();
  byId(doc, "learningTrackForm")!.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  expect((stored(doc)! as any).learningTracks).toEqual(state.learningTracks);
  expect((stored(doc)! as any).trackSettings[track.id]).toMatchObject({ cover: "", icon: "Atom" });
  expect(byId(doc, "trackFormMessage")!.textContent).toBe("Appearance saved.");
});

it("rejects unsafe or oversized images and corrupt imported track data", async () => {
  const { app, doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1" });
  await expect(app.readTrackCover({ type: "image/svg+xml", size: 100 })).rejects.toThrow("PNG, JPEG or WebP");
  await expect(app.readTrackCover({ type: "image/png", size: 6 * 1024 * 1024 })).rejects.toThrow("5 MB");
  const normalized = app.normalizeState({ learningTracks: [{ id: 'bad" onclick="alert(1)', name: "Bad", tasks: [["No"]] }], trackSettings: { python: { cover: "data:image/svg+xml;base64,PHN2Zz4=", icon: "Bad", showInSidebar: true } } }) as any;
  expect(normalized.learningTracks).toEqual([]);
  expect(normalized.trackSettings.python).toEqual({ cover: "", icon: "BookOpen", showInSidebar: true });
  createTrack(doc, "<img src=x onerror=alert(1)>", "<script>danger</script>");
  expect(doc.querySelector("#homeTracks img[src=x]")).toBeNull();
  expect(doc.querySelector("#checkpoints script")).toBeNull();
  expect(byId(doc, "homeTracks")!.textContent).toContain("<img src=x onerror=alert(1)>");
});

it("allows an empty track and appends checkpoints without resetting existing progress", async () => {
  const { doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1&page=learning" });
  createTrack(doc, "New skill", "");
  const track = (stored(doc)! as any).learningTracks[0];
  expect(track.tasks).toEqual([]);
  expect(doc.querySelector(`#homeTracks [data-inspect-track="${track.id}"]`)!.textContent).toContain("Ready to begin");
  for (const id of ["learningTrackForm", "learning"]) byId(doc, id)!.scrollIntoView = vi.fn();
  const edit = () => doc.querySelector<HTMLButtonElement>(`[data-customize-track="${track.id}"]`)!.click();
  edit();
  (byId(doc, "trackTopics") as HTMLTextAreaElement).value = "First topic";
  byId(doc, "learningTrackForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  doc.querySelector<HTMLInputElement>(`[data-task-id="${track.id}-1"] input`)!.click();
  edit();
  (byId(doc, "trackTopics") as HTMLTextAreaElement).value = "Second topic";
  byId(doc, "learningTrackForm")!.dispatchEvent(new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true }));
  expect((stored(doc)! as any).learningTracks[0].tasks).toEqual([["First topic", "Practice & verify"], ["Second topic", "Practice & verify"]]);
  expect((stored(doc)! as any).completed[`${track.id}-1`]).toBe(true);
  expect(doc.querySelector<HTMLInputElement>(`[data-task-id="${track.id}-1"] input`)!.checked).toBe(true);
});

it("keeps existing state intact when browser storage cannot save a track", async () => {
  const { doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1" });
  const before = stored(doc);
  vi.spyOn(doc.defaultView!.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
  createTrack(doc);
  expect(stored(doc)).toEqual(before);
  expect(doc.querySelectorAll("#homeTracks .learning-card")).toHaveLength(6);
  expect(byId(doc, "trackFormMessage")!.textContent).toContain("storage is full");
});

it("keeps personal tracks and appearance isolated between accounts", async () => {
  const fake = makeFakeSupabase({ auth: { session: null } });
  const { doc, app } = await bootApp({ supabaseConfig: { url: "https://supabase.example.co", anonKey: "test" }, supabaseClientFactory: () => fake });
  createTrack(doc, "Guest-only track");
  const signIn = app.applySession({ id: "another-user", email: "another@example.com" });
  expect((byId(doc, "trackName") as HTMLInputElement).value).toBe("");
  createTrack(doc, "Attempt during account change");
  expect(byId(doc, "trackFormMessage")!.textContent).toContain("still loading");
  byId(doc, "trackCancel")!.click();
  await signIn;
  expect(byId(doc, "homeTracks")!.textContent).not.toContain("Guest-only track");
  expect(byId(doc, "learningTrackList")!.textContent).not.toContain("Guest-only track");
  expect((byId(doc, "trackName") as HTMLInputElement).value).toBe("");
});

it("adds tracks to migrated legacy progress without losing completed checkpoints", async () => {
  const { doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1", preSeed: { "mission-cs-study-dashboard-v1": JSON.stringify({ completed: { "py-01": true } }) } });
  createTrack(doc, "A new path");
  expect((stored(doc)! as any).completed["python-1"]).toBe(true);
  expect((stored(doc)! as any).learningTracks[0].name).toBe("A new path");
});

it("searches checkpoint topics, roadmap instructions/topics/resources, personal resources, tasks and notes, then opens the matching content", async () => {
  const { doc } = await bootApp({ url: "http://localhost:3000/study-dashboard.html?demo=1", preSeed: { [STORAGE_KEY]: JSON.stringify({ customTasks: [{ id: "task", title: "Finish portfolio", cadence: "week" }], resources: [{ id: "r", name: "CSS handbook", description: "Responsive grids", url: "https://example.com/css" }], focus: { days: {}, sessions: [{ date: "2026-10-14", note: "Practised keyboard navigation" }] } }) } });
  const win = doc.defaultView!;
  const frame = byId(doc, "roadmapsFrame") as HTMLIFrameElement;
  const roadmap = "a754c0d1-6e9d-406d-9645-85eeea40f2e5";
  const task = "9f4ed678-318c-4d79-b1d8-f4b5a9340c46";
  win.dispatchEvent(new win.MessageEvent("message", { origin: win.location.origin, source: frame.contentWindow, data: { type: "semassist-roadmaps-tracks", tracks: [{ id: roadmap, name: "Beginner Python", subject: "Programming", tasks: [{ id: task, label: "Small script", searchText: "Investigate iterator exhaustion", completed: false }], searchEntries: [{ kind: "Roadmap topic", title: "Generator pipelines", text: "Laziness and iteration", view: "roadmap" }, { kind: "Roadmap resource", title: "Python reference", text: "Official iterator documentation", view: "resources" }] }] } }));
  for (const id of ["find", "python", "resources", "roadmaps"]) byId(doc, id)!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>('.nav-button[data-home-action="search"]')!.click();
  expect(doc.body.dataset.workspacePage).toBe("find");
  expect(doc.activeElement).toBe(byId(doc, "workspaceSearch"));
  expect(search(doc, "responsive grids")[0].textContent).toContain("CSS handbook");
  search(doc, "responsive grids")[0].click();
  expect(doc.body.dataset.workspacePage).toBe("resources");
  expect(search(doc, "portfolio")[0].textContent).toContain("Personal task");
  expect(search(doc, "keyboard navigation")[0].textContent).toContain("Focus note");
  expect(search(doc, "laziness")[0].textContent).toContain("Generator pipelines");
  expect(search(doc, "official iterator")[0].textContent).toContain("Python reference");
  const post = vi.spyOn(frame.contentWindow!, "postMessage");
  search(doc, "iterator exhaustion")[0].click();
  expect(post).toHaveBeenCalledWith({ type: "semassist-dashboard-open-roadmap", roadmap, view: "overview", task }, win.location.origin);
  expect(doc.body.dataset.workspacePage).toBe("roadmaps");
  const checkpoint = doc.querySelector<HTMLElement>('[data-task-id="python-1"]')!;
  checkpoint.scrollIntoView = vi.fn();
  const query = checkpoint.querySelector(".task-text")!.textContent!;
  search(doc, query).find(result => result.textContent?.includes("Checkpoint"))!.click();
  expect(doc.body.dataset.workspacePage).toBe("overview");
  expect(byId(doc, "python")!.getAttribute("aria-expanded")).toBe("true");
  expect(checkpoint.scrollIntoView).toHaveBeenCalled();
  expect(search(doc, "no-such-topic-anywhere")).toHaveLength(0);
  expect(byId(doc, "workspaceSearchStatus")!.textContent).toContain("No matches");
});
