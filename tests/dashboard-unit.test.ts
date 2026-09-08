import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  addFocusMinutes,
  dateKey,
  defaultState,
  escapeHtml,
  formatMinutes,
  getStats,
  buildSemesterReport,
  loadState,
  markReviewRedo,
  markReviewSolid,
  migrateLegacy,
  nextUp,
  normalizeState,
  reviewDue,
  safeColor,
  saveState,
  streak,
  todayKey,
  tracks,
  validResourceUrl,
  weekStartKey,
  weeklySeries,
  buildProfileCardSvg,
  wrapLines,
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
    expect(state.focus).toEqual({ days: {}, sessions: [] });
  });

  it("preserves provided arrays", () => {
    const state = normalizeState({ customTasks: [1], resources: [2] } as never);
    expect(state.customTasks).toHaveLength(1);
    expect(state.resources).toHaveLength(1);
  });

  it("preserves provided focus data", () => {
    const state = normalizeState({
      focus: {
        days: { "2026-09-06": 25 },
        sessions: [{ date: "2026-09-06", minutes: 25 }],
      },
    } as never);
    expect(state.focus.days["2026-09-06"]).toBe(25);
    expect(state.focus.sessions).toHaveLength(1);
  });
});

describe("formatMinutes", () => {
  it("formats minutes compactly", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(125)).toBe("2h 5m");
    expect(formatMinutes(-5)).toBe("0m");
  });
});

describe("addFocusMinutes", () => {
  it("accumulates minutes per day and keeps sessions", () => {
    const state = defaultState();
    addFocusMinutes(state, "2026-09-06", 25);
    addFocusMinutes(state, "2026-09-06", 35);
    addFocusMinutes(state, "2026-09-05", 60);
    expect(state.focus.days).toEqual({
      "2026-09-06": 60,
      "2026-09-05": 60,
    });
    expect(state.focus.sessions).toEqual([]);
  });

  it("handles legacy state without a focus field", () => {
    const state = { completed: {} } as never;
    addFocusMinutes(state, "2026-09-06", 10);
    expect(state.focus.days["2026-09-06"]).toBe(10);
    expect(state.focus.sessions).toEqual([]);
  });

  it("ignores zero or negative amounts", () => {
    const state = defaultState();
    addFocusMinutes(state, "2026-09-06", 0);
    addFocusMinutes(state, "2026-09-06", -5);
    expect(state.focus.days).toEqual({});
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

describe("nextUp", () => {
  it("returns the first three unverified checkpoints in roadmap order", () => {
    const up = nextUp(defaultState());
    expect(up.map(item => item.id)).toEqual([
      "python-1",
      "python-2",
      "python-3",
    ]);
    expect(up[0].track.name).toBe("Python");
    expect(up[0].meta).toBe("BASICS");
  });

  it("skips completed checkpoints and keeps the next three", () => {
    const state = defaultState();
    state.completed["python-1"] = true;
    state.completed["python-2"] = true;
    expect(nextUp(state).map(item => item.id)).toEqual([
      "python-3",
      "python-4",
      "python-5",
    ]);
  });

  it("honors a focus track", () => {
    const state = defaultState();
    state.completed["python-1"] = true;
    const up = nextUp(state, "java");
    expect(up.map(item => item.id)).toEqual(["java-1", "java-2", "java-3"]);
    expect(up.every(item => item.track.id === "java")).toBe(true);
  });

  it("returns an empty list when a focused track is fully verified", () => {
    const state = defaultState();
    const java = tracks.find(track => track.id === "java")!;
    java.tasks.forEach((_, index) => {
      state.completed[`java-${index + 1}`] = true;
    });
    expect(nextUp(state, "java")).toEqual([]);
    // Other tracks still have work under "all".
    expect(nextUp(state, "all").length).toBeGreaterThan(0);
  });
});

describe("review schedule", () => {
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return dateKey(date);
  };

  it("returns null for unverified or too-fresh checkpoints", () => {
    const state = defaultState();
    expect(reviewDue(state, "python-1")).toBeNull();
    state.completedAt["python-1"] = todayKey();
    expect(reviewDue(state, "python-1")).toBeNull();
    state.completedAt["python-1"] = daysAgo(2);
    expect(reviewDue(state, "python-1")).toBeNull();
  });

  it("comes due at 3, 7, then 14 days, one milestone at a time", () => {
    const state = defaultState();
    state.completedAt["python-2"] = daysAgo(20);
    expect(reviewDue(state, "python-2")).toBe(3);
    expect(markReviewSolid(state, "python-2")).toBe(true);
    expect(reviewDue(state, "python-2")).toBe(7);
    expect(markReviewSolid(state, "python-2")).toBe(true);
    expect(reviewDue(state, "python-2")).toBe(14);
    expect(markReviewSolid(state, "python-2")).toBe(true);
    expect(reviewDue(state, "python-2")).toBeNull();
  });

  it("solid review persists the milestone in state.reviews", () => {
    const state = defaultState();
    state.completedAt["java-3"] = daysAgo(6);
    expect(reviewDue(state, "java-3")).toBe(3);
    markReviewSolid(state, "java-3");
    expect(state.reviews["java-3@3"]).toBe(todayKey());
    // 7 days not reached yet → nothing more due.
    expect(reviewDue(state, "java-3")).toBeNull();
  });

  it("redo resets the clock to today and clears the milestone history", () => {
    const state = defaultState();
    state.completedAt["os-1"] = daysAgo(12);
    markReviewSolid(state, "os-1");
    expect(Object.keys(state.reviews)).toHaveLength(1);
    expect(markReviewRedo(state, "os-1")).toBe(true);
    expect(state.completedAt["os-1"]).toBe(todayKey());
    expect(state.reviews).toEqual({});
    expect(reviewDue(state, "os-1")).toBeNull();
    // Four days after the redo the fresh 3-day milestone returns.
    state.completedAt["os-1"] = daysAgo(4);
    expect(reviewDue(state, "os-1")).toBe(3);
  });
});

describe("buildSemesterReport", () => {
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return dateKey(date);
  };

  it("renders stats, per-track pulse, and journaled evidence, escaping user text", () => {
    const state = defaultState();
    state.completed["python-1"] = true;
    state.completedAt["python-1"] = daysAgo(5);
    state.completed["python-2"] = true;
    state.completedAt["python-2"] = daysAgo(2);
    state.activity[daysAgo(2)] = 1;
    state.focus.days[daysAgo(2)] = 25;
    state.focus.sessions = [
      {
        date: daysAgo(2),
        minutes: 25,
        track: "python",
        note: "Reviewed <b>lists</b> & notes",
      },
    ];
    state.customTasks = [
      {
        id: "c1",
        title: "Prepare Java talk",
        cadence: "today",
        completed: true,
        createdAt: daysAgo(1),
      },
    ];
    state.resources = [{ name: "30 Days of Python" }];

    const html = buildSemesterReport(state);
    expect(html).toContain("Semester evidence report");
    expect(html).toContain(">3/77</b>"); // checkpoints stat (incl. custom task)
    expect(html).toContain(">2/12</strong>"); // python pulse row
    expect(html).toContain(">0/8</strong>"); // os pulse row untouched
    expect(html).toContain(">25m</b>"); // focused stat
    expect(html).toContain("1/1 personal tasks");
    expect(html).toContain("Reviewed &lt;b&gt;lists&lt;/b&gt; &amp; notes");
    expect(html).toContain("30 Days of Python");
    expect(html).toContain("Deep-work ledger");
  });
});

describe("weekStartKey", () => {
  it("returns the Monday (UTC) of the week containing the date", () => {
    // 2026-09-07 is a Monday in UTC.
    expect(weekStartKey(new Date(Date.UTC(2026, 8, 7, 12, 0, 0)))).toBe(
      "2026-09-07"
    );
    expect(weekStartKey(new Date(Date.UTC(2026, 8, 7, 0, 0, 0)))).toBe(
      "2026-09-07"
    );
    // Saturday and Sunday of that week both map back to the same Monday.
    expect(weekStartKey(new Date(Date.UTC(2026, 8, 12, 0, 0, 0)))).toBe(
      "2026-09-07"
    );
    expect(weekStartKey(new Date(Date.UTC(2026, 8, 13, 23, 59, 0)))).toBe(
      "2026-09-07"
    );
    // A Tuesday belongs to its own week.
    expect(weekStartKey(new Date(Date.UTC(2026, 8, 15, 0, 0, 0)))).toBe(
      "2026-09-14"
    );
  });
});

describe("weeklySeries", () => {
  it("buckets activity into the last five weeks and derives the pace", () => {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // days since Monday (local)
    const thisMonday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset
    );
    const lastMonday = new Date(
      thisMonday.getFullYear(),
      thisMonday.getMonth(),
      thisMonday.getDate() - 7
    );
    const state = defaultState();
    state.activity[dateKey(thisMonday)] = 2;
    state.activity[dateKey(lastMonday)] = 3;

    const series = weeklySeries(state);
    expect(series.labels).toEqual(["W1", "W2", "W3", "W4", "W5"]);
    expect(series.you[4]).toBe(2); // this week
    expect(series.you[3]).toBe(3); // last week
    expect(series.you[0]).toBe(0);
    expect(series.pace).toBe(5); // 76 checkpoints / 16-week semester
  });
});

describe("wrapLines", () => {
  it("wraps text onto lines at the character limit", () => {
    expect(wrapLines("Python leads the way and then some", 20)).toEqual([
      "Python leads the way",
      "and then some",
    ]);
    expect(wrapLines("short", 50)).toEqual(["short"]);
  });
});

describe("buildProfileCardSvg", () => {
  it("renders a self-contained SVG with a neutral fallback profile and stats", () => {
    const state = defaultState();
    state.completed = {
      "python-1": true,
      "python-2": true,
      "python-3": true,
      "python-4": true,
      "python30-1": true,
      "python30-2": true,
    };
    const svg = buildProfileCardSvg(state);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("SEM ASSIST");
    expect(svg).toContain("Learner"); // neutral fallback name
    expect(svg).toContain("6/76");
    expect(svg).toContain("60"); // 6 × 10 proof points
    expect(svg).toContain("Python");
    expect(svg).toContain("Study pulse");
    expect(svg).toContain("W5");
  });

  it("uses the editable name and semester when set", () => {
    const state = defaultState();
    state.profileName = "Riya";
    state.profileSemester = "Semester 5";
    const svg = buildProfileCardSvg(state);
    expect(svg).toContain("Riya");
    expect(svg).toContain("Semester 5");
    expect(svg).toContain("R"); // avatar initial
  });

  it("escapes user-supplied name and semester text", () => {
    const state = defaultState();
    state.profileName = "<img src=x>";
    state.profileSemester = "<Semester 5>";
    const svg = buildProfileCardSvg(state);
    expect(svg).not.toContain("<img");
    expect(svg).toContain("&lt;img src=x&gt;");
    expect(svg).not.toContain("<Semester");
    expect(svg).toContain("&lt;Semester 5&gt;");
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
