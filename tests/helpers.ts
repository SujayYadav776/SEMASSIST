import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { vi } from "vitest";

const HTML_PATH = fileURLToPath(
  new URL("../client/public/study-dashboard.html", import.meta.url)
);
const HTML = readFileSync(HTML_PATH, "utf8");

export interface FakeSupabaseOptions {
  /** A pre-existing cloud row: makes the fake return it from the initial select. */
  existingState?: Record<string, unknown> | null;
  /** How many consecutive upsert attempts should fail with an error. */
  failFirstUpserts?: number;
}

export interface FakeSupabase {
  upserts: Array<Record<string, unknown>>;
  auth: {
    getSession(): Promise<{
      data: {
        session: {
          user: { id: string; email: string };
          access_token: string;
        } | null;
      };
    }>;
    signOut(): Promise<{ error: null }>;
    onAuthStateChange(): { data: { subscription: { unsubscribe(): void } } };
    signUp(): Promise<{ data: { session: null }; error: null }>;
    signInWithPassword(): Promise<{ data: { session: null }; error: null }>;
  };
  from(): unknown;
}

/** Minimal fake mirroring the supabase-js surface the dashboard uses. */
export function makeFakeSupabase(
  options: FakeSupabaseOptions = {}
): FakeSupabase & { upserts: Array<Record<string, unknown>> } {
  const upserts: Array<Record<string, unknown>> = [];
  const session = {
    user: { id: "user-1", email: "test@example.com" },
    access_token: "TEST_ACCESS_TOKEN",
  };
  let failuresLeft = options.failFirstUpserts ?? 0;
  const from = () => {
    const chain = {
      maybeSingle: async () =>
        options.existingState
          ? {
              data: { state: structuredClone(options.existingState) },
              error: null,
            }
          : { data: null, error: null },
      eq: () => chain,
      select: () => chain,
      upsert: async (payload: Record<string, unknown>) => {
        upserts.push(structuredClone(payload));
        if (failuresLeft > 0) {
          failuresLeft--;
          return { error: { message: "simulated failure" } };
        }
        return { error: null };
      },
    };
    return chain;
  };
  return {
    upserts,
    auth: {
      getSession: async () => ({ data: { session } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signUp: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { session: null },
        error: null,
      }),
    },
    from,
  };
}

export interface BootOptions {
  /** localStorage keys to seed before the module boots. */
  preSeed?: Record<string, string>;
  /** SUPABASE_CONFIG to expose on the window; omit for the local-only path. */
  supabaseConfig?: Record<string, string> | null;
  /** Factory handed to setSupabaseClientFactory; omit to keep the default loader. */
  supabaseClientFactory?: (url: string, anonKey: string) => unknown;
  /** Run init() automatically (default true). Set false to drive applySession directly. */
  runInit?: boolean;
}

/**
 * Boot the real dashboard HTML + module in a fresh jsdom window. Each boot
 * resets the module registry so module-level state never leaks between tests.
 */
export async function bootApp(options: BootOptions = {}) {
  const dom = new JSDOM(HTML, {
    url: "http://localhost:3000/study-dashboard.html",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const win = dom.window as unknown as Record<string, unknown> & {
    document: Document;
    localStorage: Storage;
  };

  win.SUPABASE_CONFIG = options.supabaseConfig ?? undefined;

  if (options.preSeed) {
    for (const [key, value] of Object.entries(options.preSeed)) {
      win.localStorage.setItem(key, value);
    }
  }

  // Point the module's implicit globals at this jsdom window.
  const globals = globalThis as Record<string, unknown>;
  globals.window = win;
  globals.document = win.document;
  globals.localStorage = win.localStorage;
  globals.HTMLElement = win.HTMLElement;
  globals.Element = win.Element;
  globals.Node = win.Node;
  globals.Event = win.Event;

  vi.resetModules();
  const app = (await import("../client/public/study-dashboard.js")) as Record<
    string,
    (arg?: unknown) => unknown
  > & { init(): Promise<void>; todayKey(): string };
  if (options.supabaseClientFactory) {
    (
      app as unknown as { setSupabaseClientFactory(factory: unknown): void }
    ).setSupabaseClientFactory(options.supabaseClientFactory);
  }
  if (options.runInit !== false) {
    await app.init();
  }
  return { app, doc: win.document, win };
}

export const byId = (doc: Document, id: string) =>
  doc.getElementById(id) as HTMLElement | null;
export const text = (el: HTMLElement | null) => (el ? el.textContent : null);
export const STORAGE_KEY = "aster-study-dashboard-v3";
export const stored = (doc: Document) =>
  JSON.parse(
    doc.defaultView!.localStorage.getItem(STORAGE_KEY) ?? "null"
  ) as Record<string, unknown> | null;
