import { afterEach, describe, expect, it, vi } from "vitest";
import { bootApp, byId, makeFakeSupabase, stored, text } from "./helpers";

const CONFIG = {
  url: "https://supabase.example.co",
  anonKey: "anon-key-1",
  redirectUrl: "http://localhost:3000/study-dashboard.html",
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cloud save path (injected fake Supabase client)", () => {
  it("uploads the initial local state on first sign-in when no cloud row exists", async () => {
    const fake = makeFakeSupabase();
    const { app, doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });

    // init() signs the fake user in; with no cloud row it must upload local state.
    expect(byId(doc, "authScreen")!.hasAttribute("hidden")).toBe(true);
    expect(text(byId(doc, "signedInEmail"))).toBe("test@example.com");

    await sleep(600); // saveState debounce is 250ms

    expect(fake.upserts).toHaveLength(1);
    const payload = fake.upserts[0];
    expect(payload.user_id).toBe("user-1");
    expect(payload.state).toMatchObject({
      completed: {},
      completedAt: {},
      activity: {},
      customTasks: [],
      resources: [],
    });
    expect(typeof payload.updated_at).toBe("string");
    expect(
      (app as unknown as { loadState(): Record<string, unknown> }).loadState()
    ).toBeTruthy();
  });

  it("keeps cloud state from being uploaded when a cloud row already exists", async () => {
    const existing = { completed: { "java-1": true } };
    const fake = makeFakeSupabase({ existingState: existing });
    const { doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });

    await sleep(500); // debounce window; nothing should be dirty/uploaded
    expect(fake.upserts).toHaveLength(0);
    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
  });

  it("debounces rapid saves into a single upsert with the full state", async () => {
    const fake = makeFakeSupabase({ existingState: {} });
    const { doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });
    await sleep(50); // let the sign-in settle (no initial upload: row exists)

    // Two checkoffs within the 250ms debounce window must collapse into one save.
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="java-1"] .check'
      )!
      .click();

    await sleep(600);
    expect(fake.upserts).toHaveLength(1);
    const completed = (
      fake.upserts[0].state as { completed: Record<string, boolean> }
    ).completed;
    expect(completed["python-1"]).toBe(true);
    expect(completed["java-1"]).toBe(true);
  });

  it("shows a toast when a cloud save fails, then recovers on the next save", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchSpy);

    const fake = makeFakeSupabase({ existingState: {}, failFirstUpserts: 1 });
    const { app, doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });
    await sleep(50);

    // First save fails: the user must see the error toast.
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    await sleep(500);
    expect(text(byId(doc, "toast"))).toBe(
      "Could not save progress. Please try again."
    );
    expect(fake.upserts).toHaveLength(1);

    // A later save succeeds and clears the dirty flag (keepaliveFlush no-ops).
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="java-1"] .check'
      )!
      .click();
    await sleep(500);
    expect(fake.upserts).toHaveLength(2);
    const completed = (
      fake.upserts[1].state as { completed: Record<string, boolean> }
    ).completed;
    expect(completed["python-1"]).toBe(true);
    expect(completed["java-1"]).toBe(true);
    (app as unknown as { keepaliveFlush(): void }).keepaliveFlush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("keepaliveFlush", () => {
  it("sends one keepalive POST with the user token and pending state when dirty", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchSpy);

    const fake = makeFakeSupabase({ existingState: {} });
    const { app, doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });
    await sleep(50);

    // Make the state dirty, then flush while a debounced save may still be pending.
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    (app as unknown as { keepaliveFlush(): void }).keepaliveFlush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `${CONFIG.url}/rest/v1/study_progress?on_conflict=user_id`
    );
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.apikey).toBe(CONFIG.anonKey);
    expect(headers.Authorization).toBe("Bearer TEST_ACCESS_TOKEN");
    expect(headers.Prefer).toBe("resolution=merge-duplicates");
    const body = JSON.parse(String(init.body)) as {
      user_id: string;
      state: { completed: Record<string, boolean> };
      updated_at: string;
    };
    expect(body.user_id).toBe("user-1");
    expect(body.state.completed["python-1"]).toBe(true);
    expect(typeof body.updated_at).toBe("string");
  });

  it("does not POST when the state is already clean", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchSpy);

    const fake = makeFakeSupabase({ existingState: {} });
    const { app, doc } = await bootApp({
      supabaseConfig: CONFIG,
      supabaseClientFactory: () => fake,
    });
    await sleep(50);

    // Check a task and let the debounced cloud save succeed (stateDirty -> false).
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="java-1"] .check'
      )!
      .click();
    await sleep(600);

    const flush = app.keepaliveFlush as unknown as () => void;
    flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

const USER = { id: "user-1", email: "user@example.com" };
const USER_KEY = "aster-study-dashboard-v3";

// Two devices that have diverged: this device's localStorage ("python" work)
// differs from what the cloud row already has ("java" work).
const LOCAL_STATE = {
  completed: { "python-1": true },
  completedAt: { "python-1": "2026-09-02" },
  activity: { "2026-09-02": 1 },
  customTasks: [
    {
      id: "custom-1",
      title: "Local-only task",
      cadence: "today",
      completed: false,
      completedAt: null,
      createdAt: "2026-09-01",
    },
  ],
  resources: [
    {
      id: "resource-1",
      name: "Local-only link",
      url: "https://example.com",
      description: "",
      color: "#f6ce50",
      x: 10,
      y: 10,
    },
  ],
};

const CLOUD_STATE = {
  completed: { "java-1": true },
  completedAt: { "java-1": "2026-09-03" },
  activity: { "2026-09-03": 1 },
  customTasks: [],
  resources: [],
};

async function bootWithoutInit(
  existingState: Record<string, unknown> | null,
  localState: Record<string, unknown>
) {
  const fake = makeFakeSupabase({ existingState });
  const boot = await bootApp({
    runInit: false,
    preSeed: { [USER_KEY]: JSON.stringify(localState) },
    supabaseConfig: CONFIG,
    supabaseClientFactory: () => fake,
  });
  return { ...boot, fake };
}

describe("applySession merge semantics (multi-device)", () => {
  it("cloud row wins over diverged local state on sign-in", async () => {
    const { app, doc, fake } = await bootWithoutInit(CLOUD_STATE, LOCAL_STATE);

    await (
      app as unknown as { applySession(user: unknown): Promise<void> }
    ).applySession(USER);

    // Cloud state (java-1 only, no custom tasks/resources) replaced local state.
    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(doc, "resourceCount"))).toBe("0 saved");
    expect(text(byId(doc, "customTaskCount"))).toBe("0 open · 0 total");
    expect(text(byId(doc, "deviceProgress"))).toBe("1 / 76");
    expect(text(byId(doc, "focusCount"))).toBe("0 / 12");
    expect(byId(doc, "authScreen")!.hasAttribute("hidden")).toBe(true);

    // Cloud load does not write through: localStorage keeps the stale local copy.
    const local = stored(doc)!;
    expect((local.resources as unknown[]).length).toBe(1);
    expect((local.completed as Record<string, boolean>)["python-1"]).toBe(true);
    // No upload happened (row existed).
    expect(fake.upserts).toHaveLength(0);

    // The first user interaction snapshots the cloud-derived state over local.
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    const after = stored(doc)!;
    expect(after.completed as Record<string, boolean>).toMatchObject({
      "java-1": true,
      "python-1": true,
    });
    expect((after.resources as unknown[]).length).toBe(0); // local-only resource gone
    expect(text(byId(doc, "workbenchCount"))).toBe("2 completed");
  });

  it("uploads the seeded local state when no cloud row exists", async () => {
    const { app, doc, fake } = await bootWithoutInit(null, LOCAL_STATE);

    await (
      app as unknown as { applySession(user: unknown): Promise<void> }
    ).applySession(USER);
    await sleep(600); // let the debounced initial upload flush

    // Local wins: python + the local-only custom task and resource are visible.
    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(doc, "resourceCount"))).toBe("1 saved");
    expect(text(byId(doc, "customTaskCount"))).toBe("1 open · 1 total");
    expect(text(byId(doc, "deviceProgress"))).toBe("1 / 77");

    expect(fake.upserts).toHaveLength(1);
    const payload = fake.upserts[0];
    expect(payload.user_id).toBe("user-1");
    const state = payload.state as Record<string, unknown>;
    expect((state.completed as Record<string, boolean>)["python-1"]).toBe(true);
    expect((state.resources as unknown[]).length).toBe(1);
    expect((state.customTasks as unknown[]).length).toBe(1);
  });

  it("signing out restores the local snapshot while the cloud row is untouched", async () => {
    const { app, doc, fake } = await bootWithoutInit(CLOUD_STATE, LOCAL_STATE);
    const apply = (
      app as unknown as { applySession(user: unknown): Promise<void> }
    ).applySession;

    // Signed in: cloud state is on screen (no local resource).
    await apply(USER);
    expect(text(byId(doc, "resourceCount"))).toBe("0 saved");
    expect(text(byId(doc, "focusCount"))).toBe("0 / 12");

    // Signed out: local snapshot returns to the screen; nothing is uploaded.
    await apply(null);
    expect(byId(doc, "authScreen")!.hasAttribute("hidden")).toBe(false);
    expect(text(byId(doc, "resourceCount"))).toBe("1 saved");
    expect(text(byId(doc, "focusCount"))).toBe("1 / 12");
    expect(text(byId(doc, "customTaskCount"))).toBe("1 open · 1 total");
    expect(fake.upserts).toHaveLength(0);
  });
});
