import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  dateKey,
  defaultState,
  escapeHtml,
  getStats,
  loadState,
  migrateLegacy,
  normalizeState,
  safeColor,
  saveState,
  streak,
  todayKey,
  tracks,
  validResourceUrl,
} from "../client/public/study-dashboard.js";

// Minimal localStorage shim so saveState/loadState can run in Node.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
});

describe("tracks data", () => {
  it("has the expected 76 roadmap checkpoints across 6 tracks", () => {
    expect(tracks).toHaveLength(6);
    const total = tracks.reduce((sum, track) => sum + track.tasks.length, 0);
    expect(total).toBe(76);
    const ids = tracks.map(track => track.id);
    expect(ids).toEqual(["python", "python30", "java", "os", "algorithms", "campusops"]);
  });
});

describe("dateKey / todayKey", () => {
  it("formats a local date without UTC drift", () => {
    expect(dateKey(new Date(2026, 8, 3, 12, 0, 0))).toBe("2026-09-03");
    expect(dateKey(new Date(2026, 0, 31, 23, 59, 0))).toBe("2026-01-31");
  });

  it("todayKey matches the current local day", () => {
    const expected = dateKey(new Date());
    expect(todayKey()).toBe(expected);
  });
});

describe("getStats", () => {
  it("starts at 0 done of 76", () => {
    const stats = getStats(defaultState());
    expect(stats.total).toBe(76);
    expect(stats.done).toBe(0);
    expect(stats.percent).toBe(0);
    expect(stats.byTrack.python.total).toBe(12);
    expect(stats.byTrack.python30.total).toBe(30);
  });

  it("counts completed checkpoints per track and overall", () => {
    const state = defaultState();
    state.completed["python-1"] = true;
    state.completed["python-2"] = true;
    state.completed["java-1"] = true;
    const stats = getStats(state);
    expect(stats.done).toBe(3);
    expect(stats.byTrack.python.done).toBe(2);
    expect(stats.byTrack.java.done).toBe(1);
    expect(stats.percent).toBe(Math.round((3 / 76) * 100));
  });

  it("includes completed custom tasks in totals", () => {
    const state = defaultState();
    state.completed["os-1"] = true;
    state.customTasks = [
      { id: "custom-1", title: "A", cadence: "today", completed: true },
      { id: "custom-2", title: "B", cadence: "week", completed: false },
    ];
    const stats = getStats(state);
    expect(stats.total).toBe(78);
    expect(stats.done).toBe(2);
    expect(stats.customDone).toBe(1);
    expect(stats.customTotal).toBe(2);
  });
});

describe("streak", () => {
  const day = (offsetDays: number, count = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return [dateKey(d), count] as const;
  };

  it("is 0 with no activity", () => {
    expect(streak({})).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const activity: Record<string, number> = {};
    for (const [key, count] of [day(0), day(-1), day(-2)]) activity[key] = count;
    expect(streak(activity)).toBe(3);
  });

  it("stops at the first gap", () => {
    const activity: Record<string, number> = {};
    for (const [key, count] of [day(0), day(-1), day(-3)]) activity[key] = count;
    expect(streak(activity)).toBe(2);
  });

  it("does not count activity starting yesterday (no activity today)", () => {
    const activity: Record<string, number> = {};
    for (const [key, count] of [day(-1), day(-2)]) activity[key] = count;
    expect(streak(activity)).toBe(0);
  });
});

describe("migrateLegacy", () => {
  it("maps legacy ids to v3 ids and drops unknown keys", () => {
    const migrated = migrateLegacy({
      completed: { "py-01": true, "java-05": true, "unknown-x": true },
      completedAt: { "py-01": "2026-09-02" },
      activity: { "2026-09-02": true, "2026-09-01": 3 },
    });
    expect(migrated.completed["python-1"]).toBe(true);
    expect(migrated.completed["java-5"]).toBe(true);
    expect("unknown-x" in migrated.completed).toBe(false);
    expect(migrated.completedAt["python-1"]).toBe("2026-09-02");
    expect(migrated.activity["2026-09-02"]).toBe(1);
    expect(migrated.activity["2026-09-01"]).toBe(3);
    expect(migrated.customTasks).toEqual([]);
    expect(migrated.resources).toEqual([]);
  });

  it("returns empty state for empty legacy input", () => {
    const migrated = migrateLegacy({});
    expect(Object.keys(migrated.completed)).toHaveLength(0);
  });
});

describe("normalizeState", () => {
  it("fills missing arrays and keeps completed keys", () => {
    const state = normalizeState({ completed: { "python-1": true } } as never);
    expect(state.completed["python-1"]).toBe(true);
    expect(state.customTasks).toEqual([]);
    expect(state.resources).toEqual([]);
    expect(typeof state.activity).toBe("object");
  });

  it("preserves provided arrays", () => {
    const state = normalizeState({ customTasks: [1], resources: [2] } as never);
    expect(state.customTasks).toHaveLength(1);
    expect(state.resources).toHaveLength(1);
  });
});

describe("saveState localStorage behavior", () => {
  it("writes the full state JSON under the storage key", () => {
    const state = defaultState();
    state.completed["python-1"] = true;
    saveState(state);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.completed["python-1"]).toBe(true);
    expect(stored).toEqual(state);
  });

  it("updates the in-memory state returned by loadState", () => {
    const first = defaultState();
    saveState(first);
    expect(loadState()).toBe(first);

    const second = defaultState();
    second.completed["java-1"] = true;
    saveState(second);
    expect(loadState()).toBe(second);
    expect(loadState().completed["java-1"]).toBe(true);
  });

  it("round-trips through loadLocalState", async () => {
    const state = defaultState();
    state.completed["os-1"] = true;
    state.customTasks = [{ id: "c1", title: "T", cadence: "today", completed: true, completedAt: null, createdAt: "2026-09-03" }];
    saveState(state);

    const { loadLocalState } = await import("../client/public/study-dashboard.js");
    const restored = loadLocalState();
    expect(restored.completed["os-1"]).toBe(true);
    expect(restored.customTasks).toHaveLength(1);
  });
});

describe("escapeHtml", () => {
  it("escapes HTML metacharacters", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("it's a & 'test'")).toBe("it&#39;s a &amp; &#39;test&#39;");
  });

  it("stringifies non-strings", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(null)).toBe("null");
  });
});

describe("validResourceUrl", () => {
  it("accepts http and https URLs", () => {
    expect(validResourceUrl("https://github.com/Asabeneh/30-Days-Of-Python")).toMatch(/^https:\/\//);
    expect(validResourceUrl("http://example.com")).toMatch(/^http:\/\//);
  });

  it("rejects non-http protocols and garbage", () => {
    expect(validResourceUrl("javascript:alert(1)")).toBeNull();
    expect(validResourceUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(validResourceUrl("ftp://example.com")).toBeNull();
    expect(validResourceUrl("not a url")).toBeNull();
    expect(validResourceUrl("")).toBeNull();
  });
});

describe("safeColor", () => {
  it("keeps valid 6-digit hex colors", () => {
    expect(safeColor("#f6ce50")).toBe("#f6ce50");
    expect(safeColor("#F6CE50")).toBe("#F6CE50");
  });

  it("falls back to the default for anything else", () => {
    expect(safeColor("red")).toBe("#f6ce50");
    expect(safeColor("red;background:url(https://evil.example/)")).toBe("#f6ce50");
    expect(safeColor("#12345")).toBe("#f6ce50");
    expect(safeColor("#1234567")).toBe("#f6ce50");
    expect(safeColor(null as never)).toBe("#f6ce50");
    expect(safeColor("")).toBe("#f6ce50");
  });
});
