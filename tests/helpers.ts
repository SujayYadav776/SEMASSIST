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
  /**
   * Seed rows for the weekly_points leaderboard table. Omit `week_start` for a
   * row that belongs to the week the board asks for; set it (e.g. to last
   * week's Monday) to prove the week filter actually isolates buckets.
   */
  leaderboardRows?: Array<{
    user_id: string;
    display_name?: string;
    points: number;
    week_start?: string;
  }>;
  /** Override the auth surface: boot session and what sign-in/sign-up return. */
  auth?: FakeAuthOptions;
}

export interface FakeAuthSession {
  user: { id: string; email: string };
  access_token: string;
}

export interface FakeAuthOptions {
  /** Session returned by getSession() (the boot-time session). null = signed out. */
  session?: FakeAuthSession | null;
  /** Session returned by a successful signInWithPassword. */
  signInSession?: FakeAuthSession | null;
  /** Error returned by signInWithPassword instead of a session. */
  signInError?: { message: string; status?: number; code?: string } | null;
  /** Session returned by a successful signUp (null when confirmation is on). */
  signUpSession?: FakeAuthSession | null;
  /** Error returned by signUp instead of a session. */
  signUpError?: { message: string; status?: number; code?: string } | null;
  /** Error returned by resend (the confirmation-email retry). */
  resendError?: { message: string; status?: number; code?: string } | null;
  /** Error returned by resetPasswordForEmail (the "Forgot password?" request). */
  resetError?: { message: string; status?: number; code?: string } | null;
  /** Error returned by updateUser (saving the new password). */
  updateUserError?: { message: string; status?: number; code?: string } | null;
}

interface WeeklyRow {
  user_id: string;
  week_start: string;
  display_name: string;
  points: number;
}

/** Seeded rows with no week_start belong to whichever week is queried. */
const CURRENT_WEEK = "current-week";

export interface FakeSupabase {
  upserts: Array<Record<string, unknown>>;
  rpcCalls: Array<{ name: string; args: Record<string, unknown> }>;
  /** Every week_start the board filtered on, in query order. */
  weekQueries: string[];
  /** Every auth call the dashboard made, in order. */
  authCalls: Array<{ method: string; args: unknown }>;
  /** How many times the study_progress row was read. */
  progressReads: number;
  /**
   * Fires the auth-event channel the dashboard subscribes to, exactly as
   * supabase-js would. Lets a test deliver a session without a form submit.
   */
  emitAuthChange(event: string, session: FakeAuthSession | null): void;
  auth: {
    getSession(): Promise<{ data: { session: FakeAuthSession | null } }>;
    signOut(): Promise<{ error: null }>;
    onAuthStateChange(
      callback: (event: string, session: FakeAuthSession | null) => void
    ): { data: { subscription: { unsubscribe(): void } } };
    signUp(args?: unknown): Promise<{ data: { session: unknown }; error: unknown }>;
    signInWithPassword(
      args?: unknown
    ): Promise<{ data: { session: unknown }; error: unknown }>;
    resend(args?: unknown): Promise<{ data: unknown; error: unknown }>;
    resetPasswordForEmail(
      email: string,
      options?: unknown
    ): Promise<{ data: unknown; error: unknown }>;
    updateUser(args?: unknown): Promise<{ data: { user: unknown }; error: unknown }>;
  };
  from(): unknown;
  rpc(name: string, args: Record<string, unknown>): Promise<{ error: null }>;
}

/** Minimal fake mirroring the supabase-js surface the dashboard uses. */
export function makeFakeSupabase(
  options: FakeSupabaseOptions = {}
): FakeSupabase & { upserts: Array<Record<string, unknown>> } {
  const upserts: Array<Record<string, unknown>> = [];
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const weekQueries: string[] = [];
  // weekly_points is keyed by (user_id, week_start). Rows seeded without a
  // week_start use a sentinel that matches whichever week is queried, so tests
  // that only care about "this week" stay free of clock math.
  const weekly = new Map<string, WeeklyRow>();
  const rowKey = (userId: string, week: string) => `${userId}|${week}`;
  const matchesWeek = (row: WeeklyRow, week: string | null) =>
    row.week_start === CURRENT_WEEK || row.week_start === week;
  const rowsFor = (week: string | null) =>
    [...weekly.values()]
      .filter(row => matchesWeek(row, week))
      .sort((a, b) => b.points - a.points);
  for (const row of options.leaderboardRows ?? []) {
    const week = row.week_start ?? CURRENT_WEEK;
    weekly.set(rowKey(row.user_id, week), {
      user_id: row.user_id,
      week_start: week,
      display_name: row.display_name ?? "",
      points: row.points,
    });
  }
  const defaultSession: FakeAuthSession = {
    user: { id: "user-1", email: "test@example.com" },
    access_token: "TEST_ACCESS_TOKEN",
  };
  // Signed in by default, so existing tests keep their boot-time session.
  const session =
    options.auth?.session === undefined ? defaultSession : options.auth.session;
  const authCalls: Array<{ method: string; args: unknown }> = [];
  const authListeners: Array<
    (event: string, session: FakeAuthSession | null) => void
  > = [];
  let progressReads = 0;
  // Mirrors the real client: a sign-in/sign-up either returns an error or a
  // session, and the default is "no session" (email confirmation on).
  const authResult = (
    method: string,
    args: unknown,
    error: FakeAuthOptions["signInError"],
    next: FakeAuthSession | null
  ) => {
    authCalls.push({ method, args });
    return error
      ? { data: { session: null }, error }
      : { data: { session: next ?? null }, error: null };
  };
  let failuresLeft = options.failFirstUpserts ?? 0;
  const from = (table: string) => {
    if (table === "weekly_points") {
      const filters: Array<{ key: string; value: string }> = [];
      const askedWeek = () =>
        filters.find(f => f.key === "week_start")?.value ?? null;
      const chain = {
        select: () => chain,
        eq: (key: string, value: string) => {
          filters.push({ key, value });
          if (key === "week_start") weekQueries.push(value);
          return chain;
        },
        order: () => chain,
        limit: async () => ({ data: rowsFor(askedWeek()), error: null }),
        maybeSingle: async () => {
          const userId = filters.find(f => f.key === "user_id")?.value;
          const row =
            rowsFor(askedWeek()).find(item => item.user_id === userId) ?? null;
          return { data: row, error: null };
        },
      };
      return chain;
    }
    const chain = {
      maybeSingle: async () => {
        progressReads++;
        return options.existingState
          ? {
              data: { state: structuredClone(options.existingState) },
              error: null,
            }
          : { data: null, error: null };
      },
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
    rpcCalls,
    weekQueries,
    authCalls,
    get progressReads() {
      return progressReads;
    },
    emitAuthChange: (event, nextSession) => {
      for (const listener of authListeners) listener(event, nextSession);
    },
    auth: {
      getSession: async () => ({ data: { session } }),
      signOut: async () => {
        authCalls.push({ method: "signOut", args: undefined });
        return { error: null };
      },
      onAuthStateChange: callback => {
        authListeners.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signUp: async (args?: unknown) =>
        authResult(
          "signUp",
          args,
          options.auth?.signUpError,
          options.auth?.signUpSession ?? null
        ),
      signInWithPassword: async (args?: unknown) =>
        authResult(
          "signInWithPassword",
          args,
          options.auth?.signInError,
          options.auth?.signInSession ?? null
        ),
      resend: async (args?: unknown) => {
        authCalls.push({ method: "resend", args });
        return { data: {}, error: options.auth?.resendError ?? null };
      },
      resetPasswordForEmail: async (email: string, resetOptions?: unknown) => {
        authCalls.push({
          method: "resetPasswordForEmail",
          args: { email, options: resetOptions },
        });
        return { data: {}, error: options.auth?.resetError ?? null };
      },
      updateUser: async (args?: unknown) => {
        authCalls.push({ method: "updateUser", args });
        if (options.auth?.updateUserError) {
          return { data: { user: null }, error: options.auth.updateUserError };
        }
        // Supabase returns the updated user; the session's user is the one the
        // recovery link established.
        return { data: { user: session?.user ?? defaultSession.user }, error: null };
      },
    },
    from,
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args: structuredClone(args) });
      if (name === "earn_points") {
        // Mirrors earn_points: points land in the week the caller names, which
        // is its local Monday rather than a server-derived UTC week.
        const week = String(args.p_week_start ?? CURRENT_WEEK);
        const userId = String(args.p_user_id);
        const key = rowKey(userId, week);
        // (user_id, week_start) is the primary key: a seeded "current week" row
        // IS the row this award updates, rather than a second one beside it.
        const sentinelKey = rowKey(userId, CURRENT_WEEK);
        const liveKey = weekly.has(key)
          ? key
          : weekly.has(sentinelKey)
            ? sentinelKey
            : key;
        const existing = weekly.get(liveKey) ?? {
          user_id: userId,
          week_start: week,
          display_name: "",
          points: 0,
        };
        existing.points += Number(args.p_amount) || 0;
        // Mirrors earn_points: NULL leaves the stored nickname alone, any
        // explicit value (including "", which clears it) replaces it, and
        // names are clamped to 16 characters.
        if (args.p_display_name !== null && args.p_display_name !== undefined) {
          existing.display_name = String(args.p_display_name).slice(0, 16);
        }
        existing.week_start = week; // concrete from here on
        if (liveKey !== key) weekly.delete(liveKey);
        weekly.set(key, existing);
      }
      return { error: null };
    },
  };
}

export interface BootOptions {
  /** Page URL override for testing local previews and deployed origins. */
  url?: string;
  /** localStorage keys to seed before the module boots. */
  preSeed?: Record<string, string>;
  /** SUPABASE_CONFIG to expose on the window; omit for the local-only path. */
  supabaseConfig?: Record<string, string> | null;
  /** Factory handed to setSupabaseClientFactory; omit to keep the default loader. */
  supabaseClientFactory?: (url: string, anonKey: string) => unknown;
  /** Run init() automatically (default true). Set false to drive applySession directly. */
  runInit?: boolean;
  /**
   * URL fragment to boot with, e.g. "#access_token=…&type=recovery" — the page
   * URL is where a recovery or confirmation link actually lands.
   */
  hash?: string;
}

/**
 * Boot the real dashboard HTML + module in a fresh jsdom window. Each boot
 * resets the module registry so module-level state never leaks between tests.
 */
export async function bootApp(options: BootOptions = {}) {
  const dom = new JSDOM(HTML, {
    url: options.url ?? `http://localhost:3000/study-dashboard.html${options.hash ?? ""}`,
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
export const USER_STORAGE_KEY = "aster-study-dashboard-v3:u-user-1";
/** Reads the guest key by default; pass a userId for a per-user key. */
export const stored = (doc: Document, userId?: string) =>
  JSON.parse(
    doc.defaultView!.localStorage.getItem(
      userId ? `${STORAGE_KEY}:u-${userId}` : STORAGE_KEY
    ) ?? "null"
  ) as Record<string, unknown> | null;
