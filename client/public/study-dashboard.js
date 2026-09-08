// The Supabase client is created lazily via ensureSupabase() (dynamic import), so this
// module can also be imported in a Node test environment without fetching esm.sh.
const STORAGE_KEY = "aster-study-dashboard-v3";
const LEGACY_KEY = "mission-cs-study-dashboard-v1";
const COOKIE_CONSENT_KEY = "semassist-cookie-consent";
const RESOURCE_SNAP_KEY = "semassist-resource-snap";
const RESOURCE_SNAP = 18;
const REVIEW_SCHEDULE = [3, 7, 14];
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const tracks = [
  {
    id: "python",
    name: "Python",
    color: "#f2ca54",
    source: "https://roadmap.sh/python",
    subtitle: "Foundation, tooling, quality, and concurrency",
    tasks: [
      [
        "Learn the basics: syntax, variables/data types, operators, type casting, strings, comments, and annotations.",
        "BASICS",
      ],
      [
        "Control flow: conditionals, loops, functions, builtin functions, and exception handling.",
        "FLOW",
      ],
      [
        "Master collections: lists, tuples, sets, dictionaries, and list comprehensions.",
        "COLLECT",
      ],
      [
        "Work through data structures: arrays, linked lists, stacks, queues, hash maps, BSTs, recursion, and sorting.",
        "DSA",
      ],
      [
        "Learn modules, custom modules, PyPI, pip, and pyproject.toml.",
        "MODULES",
      ],
      [
        "Build an OOP mini-project using classes, inheritance, methods, encapsulation, and scope.",
        "OOP",
      ],
      [
        "Use lambdas, decorators, iterators, generators, context managers, and regular expressions.",
        "PARADIGMS",
      ],
      [
        "Set up venv or virtualenv; explain pyenv, Pipenv, uv, and environment isolation.",
        "ENV",
      ],
      [
        "Build a file-handling CampusOps CLI with configuration, logging, safe errors, and a README.",
        "I/O",
      ],
      [
        "Add typing and quality checks with a formatter/linter plus pytest or unittest.",
        "QUALITY",
      ],
      [
        "Explain the GIL; compare threading, multiprocessing, and async for an OS-adjacent workload.",
        "CONCURRENCY",
      ],
      [
        "Later: choose one framework path—FastAPI, Flask, or Django—after foundations are solid.",
        "LATER",
      ],
    ],
  },
  {
    id: "python30",
    name: "30 Days of Python",
    color: "#e6a85d",
    source: "https://github.com/Asabeneh/30-Days-Of-Python",
    sourceLabel: "GitHub ↗",
    subtitle: "Asabeneh's hands-on 30-day Python challenge",
    tasks: [
      [
        "Set up Python and VS Code; run your first Hello World program.",
        "DAY 01",
      ],
      [
        "Use variables and built-in functions to inspect values and types.",
        "DAY 02",
      ],
      [
        "Practice arithmetic, comparison, logical, and assignment operators.",
        "DAY 03",
      ],
      [
        "Manipulate strings with indexing, slicing, formatting, and methods.",
        "DAY 04",
      ],
      ["Create, update, slice, and loop through Python lists.", "DAY 05"],
      ["Work with immutable tuples and convert between sequences.", "DAY 06"],
      [
        "Use sets for unique values, membership checks, and set operations.",
        "DAY 07",
      ],
      [
        "Create dictionaries and safely read, update, and iterate key-value data.",
        "DAY 08",
      ],
      [
        "Write decisions with if, elif, else, and nested conditionals.",
        "DAY 09",
      ],
      ["Use for and while loops, ranges, break, continue, and pass.", "DAY 10"],
      [
        "Define reusable functions with arguments, returns, and defaults.",
        "DAY 11",
      ],
      ["Import standard and custom modules to organize Python code.", "DAY 12"],
      [
        "Build concise transformed collections with list comprehensions.",
        "DAY 13",
      ],
      [
        "Use map, filter, reduce, lambdas, and higher-order functions.",
        "DAY 14",
      ],
      ["Recognize common Python type errors and debug their causes.", "DAY 15"],
      [
        "Create and format dates and times with Python's datetime tools.",
        "DAY 16",
      ],
      [
        "Handle runtime failures with try, except, else, and finally.",
        "DAY 17",
      ],
      ["Find, validate, and replace text using regular expressions.", "DAY 18"],
      [
        "Read from and write to text files safely with context managers.",
        "DAY 19",
      ],
      ["Install and manage packages with pip and package metadata.", "DAY 20"],
      ["Model data with classes, objects, attributes, and methods.", "DAY 21"],
      ["Extract structured information from a web page responsibly.", "DAY 22"],
      [
        "Create and use an isolated virtual environment for a project.",
        "DAY 23",
      ],
      [
        "Calculate descriptive statistics and interpret basic data summaries.",
        "DAY 24",
      ],
      ["Load, explore, and transform tabular data with pandas.", "DAY 25"],
      ["Build a small Python web project or web-facing exercise.", "DAY 26"],
      ["Connect Python concepts with MongoDB data operations.", "DAY 27"],
      ["Consume an API and work with structured response data.", "DAY 28"],
      ["Build a simple API endpoint and test its behavior.", "DAY 29"],
      [
        "Review the challenge, consolidate notes, and plan what to build next.",
        "DAY 30",
      ],
    ],
  },
  {
    id: "java",
    name: "Java",
    color: "#e89d72",
    source: "https://roadmap.sh/java",
    subtitle: "Language, OOP, collections, I/O, concurrency, testing",
    tasks: [
      [
        "Learn Java basics: lifecycle, syntax, data types, scope, casting, strings, math, arrays, loops, conditionals, and methods.",
        "BASICS",
      ],
      [
        "Use classes, objects, attributes, methods, access specifiers, static members, and nested classes.",
        "OBJECTS",
      ],
      [
        "Complete OOP: abstraction, inheritance, overriding, dynamic binding, interfaces, and encapsulation.",
        "OOP",
      ],
      [
        "Use packages, enums, final, records, annotations, initializer blocks, and modules appropriately.",
        "STRUCTURE",
      ],
      [
        "Master ArrayList, Set, Map, Queue, Stack, Deque, Iterator, generics, and Optionals.",
        "COLLECT",
      ],
      [
        "Handle expected and unexpected failure with checked/unchecked exceptions and an error strategy.",
        "ERRORS",
      ],
      [
        "Practice file I/O, date/time, regular expressions, and logging in a CampusOps utility.",
        "I/O",
      ],
      [
        "Use Maven or Gradle to manage dependencies, run tests, and create a reproducible project.",
        "BUILD",
      ],
      [
        "Work through lambdas, functional interfaces, functional composition, and the Stream API.",
        "FUNCTIONAL",
      ],
      [
        "Build a producer–consumer lab; explain virtual threads, Java Memory Model, and volatile.",
        "CONCURRENCY",
      ],
      [
        "Add JUnit unit tests and one integration-test scenario; use mocks only when they help.",
        "TESTING",
      ],
      [
        "Later: begin JDBC/database access, then consider Spring Boot once core Java is comfortable.",
        "LATER",
      ],
    ],
  },
  {
    id: "os",
    name: "OS / Linux",
    color: "#a9ca6c",
    source: "",
    subtitle: "Processes, threads, memory, files, IPC, observability",
    tasks: [
      [
        "Navigate Linux confidently: files, permissions, users, environment variables, pipes, and redirects.",
        "LINUX",
      ],
      [
        "Use ps, top/htop, lsof, strace, and logs to observe a running process.",
        "OBSERVE",
      ],
      [
        "Explain lifecycle, parent/child relationships, exit status, signals, and file descriptors.",
        "PROCESS",
      ],
      [
        "Write a C program using fork, exec, wait, and a pipe; document what changes in each process.",
        "SYS CALL",
      ],
      [
        "Explain stack, heap, code, and data segments; debug a memory issue with sanitizers or a debugger.",
        "MEMORY",
      ],
      [
        "Create a race condition, reproduce it, then fix it with a lock or condition variable.",
        "THREADS",
      ],
      [
        "Draw a file read through process, system call, kernel, filesystem, and storage.",
        "FILES",
      ],
      [
        "Build a process inspector or mini shell subset and write a failure-mode note.",
        "LAB",
      ],
    ],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    color: "#8ba7d9",
    source: "",
    subtitle: "Repeated practice in both primary languages",
    tasks: [
      [
        "Write Big-O explanations for arrays, linked lists, stacks, queues, hash maps, and heaps.",
        "MODEL",
      ],
      [
        "Implement a stack, queue, and linked list in Python and Java with tests.",
        "BUILD",
      ],
      [
        "Complete 15 array, string, hashing, or two-pointer problems and re-solve mistakes.",
        "PRACTICE",
      ],
      [
        "Complete 15 recursion, sorting, binary-search, tree, or heap problems; state the invariant.",
        "PRACTICE",
      ],
      [
        "Create an error log: first wrong idea, final invariant, complexity, and a variation.",
        "REVIEW",
      ],
      [
        "Benchmark a data-structure task in Python and Java; state what the benchmark can and cannot prove.",
        "MEASURE",
      ],
    ],
  },
  {
    id: "campusops",
    name: "CampusOps",
    color: "#c5a6dc",
    source: "",
    subtitle: "Flagship project evidence",
    tasks: [
      [
        "Write a one-page problem statement, users, constraints, and success measure.",
        "DESIGN",
      ],
      [
        "Create the Java domain model, validation rules, and repository boundary with tests.",
        "JAVA",
      ],
      [
        "Create Python import, report, cleanup, and health-check commands.",
        "PYTHON",
      ],
      [
        "Run it on Linux; document environment variables, processes, ports, logs, and shutdown.",
        "LINUX",
      ],
      [
        "Add a C process-inspector, producer–consumer queue, or shell lab component.",
        "OS LAB",
      ],
      [
        "Create an architecture diagram, README, test report, benchmark note, and retrospective.",
        "PROOF",
      ],
      [
        "Ask a reviewer: what would fail first, and what concept is weakest?",
        "REVIEW",
      ],
      [
        "Deliver a reproducible clean-environment demo and record the next technical debt item.",
        "SHIP",
      ],
    ],
  },
];
let supabase = null;
let supabasePromise = null;
let supabaseClientFactory = null;

// Dependency-injection seam: lets a host (or a test) supply its own Supabase
// client factory instead of dynamically importing the pinned esm.sh build.
// Not used by the default browser boot; it only takes effect when called.
function setSupabaseClientFactory(factory) {
  supabaseClientFactory = factory;
}

function getSupabaseConfig() {
  return typeof window !== "undefined" ? window.SUPABASE_CONFIG : null;
}

async function ensureSupabase() {
  if (supabase || typeof window === "undefined") return supabase;
  const cfg = getSupabaseConfig();
  if (!cfg?.url || !cfg?.anonKey || cfg.url.includes("YOUR_")) return null;
  if (!supabasePromise) {
    const createClient = supabaseClientFactory
      ? Promise.resolve(supabaseClientFactory(cfg.url, cfg.anonKey))
      : import("https://esm.sh/@supabase/supabase-js@2.115.0").then(module =>
          module.createClient(cfg.url, cfg.anonKey)
        );
    supabasePromise = createClient
      .then(client => {
        supabase = client;
        return supabase;
      })
      .catch(() => {
        supabasePromise = null;
        return null;
      });
  }
  return supabasePromise;
}
let activeFilter = "all";
let focusSeconds = 0;
let focusCommitted = 0;
let timerId = null;
let keyboardCursorId = null;
let journalMinutes = 0;
let currentState = null;
let currentUser = null;
let saveTimer = null;
let currentAccessToken = null;
let stateDirty = false;
const taskId = (track, index) => `${track.id}-${index + 1}`;
const dateKey = date => {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
};
const todayKey = () => dateKey(new Date());
const CHECKPOINT_POINTS = 10;
const SEMESTER_WEEKS = 16;
const PROFILE_NAME = "Sujay";
function defaultState() {
  return {
    completed: {},
    completedAt: {},
    activity: {},
    customTasks: [],
    resources: [],
    focus: { days: {}, sessions: [] },
    queueFocus: "all",
    reviews: {},
    leaderboardName: "",
    profileSemester: "Semester 3",
  };
}
function migrateLegacy(old) {
  const keyMap = {};
  const legacyPrefixes = {
    python: "py",
    java: "java",
    os: "os",
    algorithms: "algo",
    campusops: "co",
  };
  tracks.forEach(track =>
    track.tasks.forEach((_, index) => {
      const legacy = `${legacyPrefixes[track.id]}-${String(index + 1).padStart(2, "0")}`;
      keyMap[legacy] = taskId(track, index);
    })
  );
  const completed = {};
  const completedAt = {};
  Object.entries(old.completed || {}).forEach(([oldId, value]) => {
    const newId = keyMap[oldId];
    if (newId && value) completed[newId] = true;
  });
  Object.entries(old.completedAt || {}).forEach(([oldId, date]) => {
    const newId = keyMap[oldId];
    if (newId) completedAt[newId] = date;
  });
  const activity = {};
  Object.entries(old.activity || {}).forEach(
    ([date, count]) =>
      (activity[date] = count === true ? 1 : Number(count) || 0)
  );
  return { completed, completedAt, activity, customTasks: [], resources: [], focus: { days: {}, sessions: [] }, reviews: {} };
}
function normalizeState(state) {
  return {
    ...defaultState(),
    ...state,
    customTasks: Array.isArray(state?.customTasks) ? state.customTasks : [],
    resources: Array.isArray(state?.resources) ? state.resources : [],
    focus: {
      days:
        state?.focus && typeof state.focus.days === "object" && state.focus.days !== null
          ? state.focus.days
          : {},
      sessions: Array.isArray(state?.focus?.sessions)
        ? state.focus.sessions
        : [],
    },
  };
}
function loadLocalState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === "object") return normalizeState(stored);
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (old && typeof old === "object") return migrateLegacy(old);
  } catch {}
  return defaultState();
}
function loadState() {
  return currentState || defaultState();
}
function saveState(state) {
  currentState = state;
  stateDirty = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  if (!currentUser) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushCloudSave, 250);
}
async function flushCloudSave() {
  if (!currentUser || !currentState) return;
  const sb = await ensureSupabase();
  if (!sb) return;
  const { error } = await sb.from("study_progress").upsert({
    user_id: currentUser.id,
    state: currentState,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    showToast("Could not save progress. Please try again.");
  } else {
    stateDirty = false;
  }
}
function keepaliveFlush() {
  if (!stateDirty || !currentUser || !currentState) return;
  const cfg = getSupabaseConfig();
  if (!cfg?.url || !cfg?.anonKey || cfg.url.includes("YOUR_")) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    fetch(`${cfg.url}/rest/v1/study_progress?on_conflict=user_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: `Bearer ${currentAccessToken || cfg.anonKey}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        state: currentState,
        updated_at: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}
// Cookie consent banner. The dashboard stores study progress and the sign-in
// session in localStorage only and sets no tracking cookies, so both buttons
// are informational: the choice is persisted so the banner shows once per
// browser, and nothing about the app's behavior changes either way.
function initCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;
  if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;
  banner.hidden = false;
  const accept = document.getElementById("cookieAccept");
  const decline = document.getElementById("cookieDecline");
  // Remember where focus was so it can be returned once the banner closes;
  // the banner sits at the end of the DOM, so without this a keyboard user
  // is dropped at the page's start.
  const previouslyFocused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const setConsent = value => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {}
    banner.hidden = true;
    if (previouslyFocused && previouslyFocused !== document.body) {
      previouslyFocused.focus();
    } else {
      // Focus was on the page itself (normal first-visit boot): blurring the
      // banner's button hands focus back to the page. (body.focus() would be
      // equivalent in browsers but is a no-op in jsdom when a child is focused.)
      document.activeElement?.blur();
    }
  };
  accept?.addEventListener("click", () => setConsent("accepted"));
  decline?.addEventListener("click", () => setConsent("declined"));
  // Move focus into the banner so keyboard and screen-reader users meet it
  // immediately instead of tabbing through the whole dashboard first.
  accept?.focus();
}
function getStats(state) {
  let total = 0,
    done = 0;
  const byTrack = {};
  tracks.forEach(track => {
    const entries = track.tasks.map((task, index) => ({
      id: taskId(track, index),
      label: task[0],
      meta: task[1],
    }));
    const count = entries.filter(task => state.completed[task.id]).length;
    total += entries.length;
    done += count;
    byTrack[track.id] = {
      total: entries.length,
      done: count,
      percent: Math.round((count / entries.length) * 100),
    };
  });
  const customTasks = Array.isArray(state.customTasks) ? state.customTasks : [];
  const customDone = customTasks.filter(task => task.completed).length;
  total += customTasks.length;
  done += customDone;
  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    byTrack,
    customDone,
    customTotal: customTasks.length,
  };
}
function streak(activity) {
  let count = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  while ((Number(activity[dateKey(current)]) || 0) > 0) {
    count++;
    current.setDate(current.getDate() - 1);
  }
  return count;
}
// Keyboard navigation over the visible checkpoint rows. A single cursor row
// (id kept across re-renders) is moved with j/k; the owning tile is revealed so
// the row is actually visible, and Space toggles the cursor row's checkbox.
function keyboardRows() {
  return [...document.querySelectorAll("#checkpoints .task-row:not(.hidden)")];
}
function keyboardRowById(id) {
  return keyboardRows().find(row => row.dataset.taskId === id) || null;
}
function revealKeyboardRow(row) {
  const card = row.closest(".track-card");
  if (!card) return;
  if (!card.classList.contains("open") && !card.classList.contains("expanded")) {
    // One keyboard tile at a time: collapse other tiles (never search results)
    // so their overlay lists do not stack over the one being walked.
    document.querySelectorAll("#checkpoints .track-card").forEach(other => {
      if (other !== card && !other.classList.contains("expanded")) {
        other.classList.remove("open");
        other.setAttribute("aria-expanded", "false");
      }
    });
    card.classList.add("open");
    card.setAttribute("aria-expanded", "true");
  }
  if (typeof row.scrollIntoView === "function")
    row.scrollIntoView({ block: "nearest" });
}
function applyKeyboardCursor() {
  document
    .querySelectorAll(".task-row.key-cursor")
    .forEach(row => row.classList.remove("key-cursor"));
  const row = keyboardRowById(keyboardCursorId);
  if (row) row.classList.add("key-cursor");
}
function moveKeyboardCursor(delta) {
  const rows = keyboardRows();
  if (!rows.length) return;
  let index = rows.findIndex(row => row.dataset.taskId === keyboardCursorId);
  if (index === -1) index = delta > 0 ? -1 : rows.length;
  const next = rows[Math.max(0, Math.min(rows.length - 1, index + delta))];
  keyboardCursorId = next.dataset.taskId;
  revealKeyboardRow(next);
  applyKeyboardCursor();
}
function toggleKeyboardCursor() {
  const row = keyboardRowById(keyboardCursorId);
  const check = row && row.querySelector(".check");
  if (check && !check.disabled) check.click();
}
function toggleFocusTimer() {
  if (timerId) {
    document.getElementById("timerPause")?.click();
    showToast("Focus timer paused.");
  } else {
    document.getElementById("timerStart")?.click();
    showToast("Focus timer running.");
  }
}
function renderTracks(state) {
  const container = document.getElementById("checkpoints");
  // Keep manually opened tiles open across re-renders (e.g. after ticking a task).
  const openIds = new Set(
    [...container.querySelectorAll(".track-card.open")].map(card => card.id)
  );
  container.innerHTML = "";
  const stats = getStats(state);
  tracks.forEach(track => {
    const card = document.createElement("article");
    card.className = "track-card wide";
    card.id = track.id;
    card.setAttribute("aria-expanded", openIds.has(track.id) ? "true" : "false");
    if (openIds.has(track.id)) card.classList.add("open");
    card.style.setProperty("--track", track.color);
    const source = track.source
      ? `<a class="source-link" href="${track.source}" target="_blank" rel="noreferrer">${track.sourceLabel || "roadmap.sh ↗"}</a>`
      : "";
    card.innerHTML =
      `<header class="track-head" tabindex="0" title="Click to expand or collapse">` +
      `<div class="track-name"><i></i><div><h3>${track.name}</h3><p>${track.subtitle}</p></div></div>` +
      `<div class="track-progress">` +
      `<span class="mini-orbit" style="--progress:${stats.byTrack[track.id].percent}%"></span>` +
      `<strong>${stats.byTrack[track.id].done}/${stats.byTrack[track.id].total}</strong>` +
      source +
      `</div></header><div class="task-list"></div>`;
    const list = card.querySelector(".task-list");
    track.tasks.forEach((task, index) => {
      const id = taskId(track, index);
      const checked = Boolean(state.completed[id]);
      const label = document.createElement("label");
      label.className = "task-row" + (checked ? " done" : "");
      label.dataset.taskId = id;
      label.dataset.track = track.id;
      label.innerHTML =
        `<input class="check" type="checkbox" ${checked ? "checked" : ""} />` +
        `<span class="task-text">${task[0]}</span>` +
        `<span class="task-meta">${task[1]}</span>`;
      label
        .querySelector(".check")
        .addEventListener("change", event =>
          toggleTask(id, track.id, event.target.checked)
        );
      list.appendChild(label);
    });
    container.appendChild(card);
  });
  applyFilters();
  applyKeyboardCursor();
}
function renderWeeklyProgress(state) {
  const chart = document.getElementById("studyBars");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const counts = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return Number(state.activity[dateKey(day)]) || 0;
  });
  const total = counts.reduce((sum, count) => sum + count, 0);
  const peak = Math.max(...counts, 1);
  chart.innerHTML = "";
  counts.forEach((count, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const column = document.createElement("div");
    const isToday = dateKey(day) === todayKey();
    column.className = `weekly-column${isToday ? " today" : ""}${count ? " has-progress" : ""}`;
    const completionWord = count === 1 ? "completion" : "completions";
    column.title = `${WEEKDAY_NAMES[index]}: ${count} ${completionWord}`;
    const value = document.createElement("span");
    value.className = `weekly-value${count ? " has-progress" : ""}`;
    value.textContent = count || "–";
    const rail = document.createElement("span");
    rail.className = "bar-rail";
    const bar = document.createElement("span");
    bar.className = "bar-stick";
    bar.style.height = `${count ? Math.max(18, Math.round((count / peak) * 100)) : 4}%`;
    rail.appendChild(bar);
    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = WEEKDAY_LETTERS[index];
    column.append(value, rail, label);
    chart.appendChild(column);
  });
  document.getElementById("weeklyHours").textContent = total;
  document.getElementById("weeklyNote").textContent = total
    ? `${total} completion${total === 1 ? "" : "s"} recorded since Monday.`
    : "Your week is ready for its first checkpoint.";
  renderFocusTotals(state);
}
function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
function addFocusMinutes(state, date, minutes) {
  const amount = Math.max(0, Math.round(Number(minutes) || 0));
  if (!amount) return state;
  const days =
    state.focus && typeof state.focus.days === "object"
      ? state.focus.days
      : {};
  days[date] = (Number(days[date]) || 0) + amount;
  state.focus = {
    days,
    sessions: Array.isArray(state.focus?.sessions)
      ? state.focus.sessions
      : [],
  };
  return state;
}
function renderFocusTotals(state) {
  const days =
    state.focus && typeof state.focus.days === "object"
      ? state.focus.days
      : {};
  const todayEl = document.getElementById("focusToday");
  if (todayEl)
    todayEl.textContent = `${formatMinutes(Number(days[todayKey()]) || 0)} today`;
  const chart = document.getElementById("focusBars");
  if (!chart) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const minutes = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return Number(days[dateKey(day)]) || 0;
  });
  const weekTotal = minutes.reduce((sum, count) => sum + count, 0);
  const peak = Math.max(...minutes, 1);
  chart.innerHTML = "";
  minutes.forEach((count, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const column = document.createElement("div");
    const isToday = dateKey(day) === todayKey();
    column.className = `weekly-column${isToday ? " today" : ""}${count ? " has-progress" : ""}`;
    column.title = `${WEEKDAY_NAMES[index]}: ${count} focused ${count === 1 ? "minute" : "minutes"}`;
    const value = document.createElement("span");
    value.className = `weekly-value${count ? " has-progress" : ""}`;
    value.textContent = count || "–";
    const rail = document.createElement("span");
    rail.className = "bar-rail";
    const bar = document.createElement("span");
    bar.className = "bar-stick";
    if (count) bar.style.background = "var(--yellow)";
    bar.style.height = `${count ? Math.max(18, Math.round((count / peak) * 100)) : 4}%`;
    rail.appendChild(bar);
    column.append(value, rail);
    chart.appendChild(column);
  });
  const note = document.getElementById("weeklyFocusNote");
  if (note) {
    let text = weekTotal
      ? `${formatMinutes(weekTotal)} focused this week.`
      : "No focus time recorded this week.";
    // Story per track: sum this week's journaled sessions by their tag.
    const sessions = Array.isArray(state.focus.sessions)
      ? state.focus.sessions
      : [];
    const mondayKey = dateKey(monday);
    const todayKeyValue = todayKey();
    const byTrack = {};
    sessions.forEach(session => {
      if (!session || !session.track || !session.date) return;
      if (session.date < mondayKey || session.date > todayKeyValue) return;
      const track = tracks.find(item => item.id === session.track);
      if (!track) return;
      byTrack[track.id] =
        (byTrack[track.id] || 0) + (Number(session.minutes) || 0);
    });
    const parts = Object.entries(byTrack)
      .filter(([, minutes]) => minutes > 0)
      .map(([id, minutes]) => {
        const track = tracks.find(item => item.id === id);
        return `${track ? track.name : id} ${formatMinutes(minutes)}`;
      });
    if (parts.length) text += ` · ${parts.join(" · ")}`;
    note.textContent = text;
  }
}
// The next up-to-three unverified checkpoints, in roadmap order. When a focus
// track is given (any real track id, or "all"), only that track's remaining
// steps are considered so the day's mission can be chosen rather than narrated.
function nextUp(state, focus = "all") {
  const wanted = focus && focus !== "all" ? focus : null;
  const out = [];
  for (const track of tracks) {
    if (wanted && track.id !== wanted) continue;
    for (let index = 0; index < track.tasks.length; index++) {
      const id = taskId(track, index);
      if (state.completed[id]) continue;
      out.push({
        id,
        track: { id: track.id, name: track.name, color: track.color },
        label: track.tasks[index][0],
        meta: track.tasks[index][1],
      });
      if (out.length === 3) return out;
    }
  }
  return out;
}
function renderMissionQueue(state) {
  const queue = document.getElementById("missionQueue");
  const select = document.getElementById("queueFocus");
  if (!queue || !select) return;
  if (!select.options.length) {
    const option = (value, label) => {
      const element = document.createElement("option");
      element.value = value;
      element.textContent = label;
      return element;
    };
    select.appendChild(option("all", "All tracks"));
    tracks.forEach(track =>
      select.appendChild(option(track.id, track.name))
    );
  }
  const focus =
    state.queueFocus && tracks.some(track => track.id === state.queueFocus)
      ? state.queueFocus
      : "all";
  select.value = focus;
  const upcoming = nextUp(state, focus);
  if (!upcoming.length) {
    const focusTrack = tracks.find(track => track.id === focus);
    const message = nextUp(state, "all").length
      ? `${focusTrack ? focusTrack.name : "This track"} is fully verified — switch focus or enjoy the win.`
      : "Every checkpoint verified — the roadmap is complete.";
    queue.innerHTML = `<div class="queue-empty"><i>✓</i><span>${message}</span></div>`;
    return;
  }
  queue.innerHTML = upcoming
    .map(
      (item, index) =>
        `<button type="button" class="queue-row" data-qid="${item.id}" data-track="${item.track.id}" style="--qdot:${item.track.color}" title="Verify in ${item.track.name}">` +
        `<i>${index + 1}</i>` +
        `<span class="queue-main"><b>${escapeHtml(item.label)}</b>` +
        `<small><s></s>${escapeHtml(item.track.name)} · ${escapeHtml(item.meta)}</small></span>` +
        `</button>`
    )
    .join("");
}
// Monday-UTC of the week containing the given date — must match the
// date_trunc('week', now()) the earn_points RPC uses for weekly_points rows.
function weekStartKey(date = new Date()) {
  const day = (date.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day)
  );
  return monday.toISOString().slice(0, 10);
}
let leaderboardTimer = null;
function scheduleLeaderboardRefresh() {
  clearTimeout(leaderboardTimer);
  leaderboardTimer = setTimeout(refreshLeaderboard, 400);
}
// Fire-and-forget leaderboard point award. Never surfaces an error toast — it
// is a best-effort social layer, independent of the (toasting) progress save.
async function awardPoints(amount) {
  if (!currentUser) return;
  const sb = await ensureSupabase();
  if (!sb) return;
  const name = String(loadState().leaderboardName || "")
    .trim()
    .slice(0, 16);
  try {
    await sb.rpc("earn_points", {
      p_user_id: currentUser.id,
      p_amount: amount,
      p_display_name: name || null,
    });
  } catch {
    return;
  }
  scheduleLeaderboardRefresh();
}
function saveLeaderboardName() {
  const input = document.getElementById("leaderboardName");
  if (!input) return;
  const state = loadState();
  state.leaderboardName = String(input.value || "")
    .trim()
    .slice(0, 16);
  saveState(state);
  input.value = state.leaderboardName;
  awardPoints(0); // sync the display name to the board row immediately
  showToast("Leaderboard nickname saved.");
}
async function refreshLeaderboard() {
  const block = document.getElementById("leaderboardBlock");
  const list = document.getElementById("leaderboardList");
  const mine = document.getElementById("leaderboardMine");
  if (!block || !list || !mine) return;
  if (!currentUser) {
    block.hidden = true;
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  const nameInput = document.getElementById("leaderboardName");
  if (nameInput && !nameInput.matches(":focus")) {
    nameInput.value = loadState().leaderboardName || "";
  }
  const [{ data: topData, error: topError }, { data: mineData }] =
    await Promise.all([
      sb
        .from("weekly_points")
        .select("user_id, display_name, points")
        .eq("week_start", weekStartKey())
        .order("points", { ascending: false })
        .limit(5),
      sb
        .from("weekly_points")
        .select("user_id, display_name, points")
        .eq("user_id", currentUser.id)
        .eq("week_start", weekStartKey())
        .maybeSingle(),
    ]);
  if (topError) {
    // Table missing or unreachable: show the honest empty state rather than a
    // blank block (e.g. before supabase/schema.sql has been applied once).
    list.innerHTML =
      `<p class="lb-empty">No points yet this week — be the first.</p>`;
    mine.textContent = "";
    return;
  }
  const top = (topData || []).filter(row => Number(row.points) > 0);
  const me =
    mineData && Number(mineData.points) > 0 ? mineData : null;
  const myRank = me
    ? top.findIndex(row => row.user_id === me.user_id) + 1
    : 0;
  const medal = index =>
    index === 0 ? " medal-1" : index === 1 ? " medal-2" : index === 2 ? " medal-3" : "";
  const rowHtml = (row, rank) =>
    `<div class="lb-row${medal(rank - 1)}${row.user_id === currentUser.id ? " you" : ""}">` +
    `<i>${rank}</i><span>${escapeHtml(String(row.display_name || "").trim() || "Learner")}</span>` +
    `<b>${Number(row.points)}</b></div>`;
  const rows = top.map((row, index) => rowHtml(row, index + 1)).join("");
  const youOutside = me && myRank === 0;
  list.innerHTML =
    rows + (youOutside ? `<div class="lb-sep"></div>${rowHtml(me, "…")}` : "") ||
    `<p class="lb-empty">No points yet this week — be the first.</p>`;
  mine.textContent = me
    ? `You · ${me.points} pts${myRank ? ` · #${myRank}` : ""}`
    : "";
}
// The three most-advanced tracks, shown as the profile's skill badges.
function topSkills(state) {
  const stats = getStats(state);
  return [...tracks]
    .sort((a, b) => stats.byTrack[b.id].done - stats.byTrack[a.id].done)
    .slice(0, 3);
}
// Five-week completion series (this week last) plus the weekly pace needed to
// finish the semester on schedule.
function weeklySeries(state) {
  const stats = getStats(state);
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // days since Monday (local)
  const you = [];
  for (let k = 4; k >= 0; k--) {
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset - k * 7
    );
    let count = 0;
    for (let day = 0; day < 7; day++) {
      const d = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + day
      );
      const key = dateKey(d);
      if (key > todayKey()) break;
      count += Number((state.activity || {})[key]) || 0;
    }
    you.push(count);
  }
  const pace = Math.max(1, Math.ceil(stats.total / SEMESTER_WEEKS));
  return { labels: ["W1", "W2", "W3", "W4", "W5"], you, pace };
}
function buildPulseSvg(series) {
  const { labels, you, pace } = series;
  const n = you.length;
  const W = 280;
  const H = 120;
  const padX = 14;
  const padTop = 30;
  const padBottom = 26;
  const maxY = Math.max(pace, ...you, 1);
  const x = i => padX + (i * (W - padX * 2)) / (n - 1);
  const y = v => padTop + (1 - v / maxY) * (H - padTop - padBottom);
  const last = n - 1;
  const youPts = you.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const pacePts = [0, last].map(i => `${x(i)},${y(pace)}`).join(" ");
  const bubbleX = Math.min(Math.max(x(last) - 34, 2), W - 72);
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">` +
    `<line x1="${x(last)}" y1="${y(you[last])}" x2="${x(last)}" y2="${H - padBottom + 3}" stroke="rgba(255,255,255,.28)" stroke-dasharray="3 3"/>` +
    `<polyline points="${pacePts}" fill="none" stroke="#dfe3ec" stroke-width="1.5" stroke-dasharray="5 4" opacity=".85"/>` +
    `<polyline points="${youPts}" fill="none" stroke="#f6ce50" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    you
      .map(
        (v, i) =>
          `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="#f6ce50"/>`
      )
      .join("") +
    `<rect x="${bubbleX}" y="${y(you[last]) - 25}" width="68" height="18" rx="9" fill="#f6ce50"/>` +
    `<text x="${bubbleX + 34}" y="${y(you[last]) - 12}" text-anchor="middle" font-size="9" font-weight="800" fill="#332f1e">${you[last]} pts</text>` +
    labels
      .map((label, i) =>
        i === last
          ? `<circle cx="${x(i)}" cy="${H - padBottom + 9}" r="9" fill="#f6ce50"/><text x="${x(i)}" y="${H - padBottom + 12.5}" text-anchor="middle" font-size="8" font-weight="800" fill="#332f1e">${label}</text>`
          : `<text x="${x(i)}" y="${H - padBottom + 12.5}" text-anchor="middle" font-size="8" fill="#a7acb8">${label}</text>`
      )
      .join("") +
    `</svg>`
  );
}
function wrapLines(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = (line ? line + " " : "") + word;
    if (line && candidate.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
// Self-contained, shareable SVG of the profile card (avatar, name, semester,
// skill badges, bio, metric pills, and the study-pulse chart). Rendered at a
// fixed 1080×1350 and rasterized to PNG client-side — no dependencies.
function buildProfileCardSvg(state) {
  const stats = getStats(state);
  const semester = escapeHtml(state.profileSemester || "Semester 3");
  const semW = 60 + (state.profileSemester || "Semester 3").length * 16;
  const skills = topSkills(state);
  const lead = skills[0];
  const bio =
    `${stats.done} of ${stats.total} checkpoints verified.` +
    (stats.byTrack[lead.id].done > 0 ? ` ${lead.name} leads the way.` : "");
  const bioLines = wrapLines(bio, 50);
  const focusDays =
    state.focus && typeof state.focus.days === "object" ? state.focus.days : {};
  const focusTotal = Object.values(focusDays).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
  const focusLabel =
    focusTotal >= 60
      ? `${Math.floor(focusTotal / 60)}h ${focusTotal % 60}m`
      : `${focusTotal}m`;
  const metrics = [
    { label: "Checkpoints", value: `${stats.done}/${stats.total}`, fill: "#f6ce50", ink: "#33301f" },
    { label: "Streak", value: `${streak(state.activity)}`, fill: "#33322e", ink: "#f2f0e8" },
    { label: "Focus", value: focusLabel, fill: "url(#striped)", ink: "#4a3d12" },
    { label: "Proof points", value: `${stats.done * 10}`, fill: "#ffffff", ink: "#33302a" },
  ];
  const series = weeklySeries(state);
  const n = series.you.length;
  const W = 1080;
  const H = 1350;
  const badgeGap = 18;
  const badgeW = label => 40 + label.length * 15;
  const totalBadgeW =
    skills.reduce((sum, track) => sum + badgeW(track.name), 0) +
    badgeGap * (skills.length - 1);
  let badgeX = (W - totalBadgeW) / 2;
  const badgeRects = skills.map(track => {
    const w = badgeW(track.name);
    const rect = { x: badgeX, w, color: track.color };
    badgeX += w + badgeGap;
    return rect;
  });
  const metricGap = 26;
  const metricW = 232;
  const metricH = 96;
  const metricTotal =
    metrics.length * metricW + (metrics.length - 1) * metricGap;
  const metricX = i => (W - metricTotal) / 2 + i * (metricW + metricGap);
  const chartL = 110;
  const chartR = 790;
  const chartT = 1050;
  const chartB = 1190;
  const maxY = Math.max(series.pace, ...series.you, 1);
  const cx = i => chartL + (i * (chartR - chartL)) / (n - 1);
  const cy = v => chartB - (v / maxY) * (chartB - chartT);
  const youPts = series.you.map((v, i) => `${cx(i)},${cy(v)}`).join(" ");
  const pacePts = `${cx(0)},${cy(series.pace)} ${cx(n - 1)},${cy(series.pace)}`;
  const last = n - 1;
  const monthYear = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const bubbleX = Math.min(Math.max(cx(last) - 55, chartL + 4), chartR - 116);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Manrope, -apple-system, 'Segoe UI', Arial, sans-serif">` +
    `<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ce50"/><stop offset="1" stop-color="#e89a3c"/></linearGradient>` +
    `<pattern id="striped" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="18" height="18" fill="#eec13e"/><rect width="9" height="18" fill="#f6ce50"/></pattern></defs>` +
    `<rect width="${W}" height="${H}" rx="36" fill="#fcfbf6"/>` +
    `<rect x="70" y="66" width="28" height="28" rx="8" fill="url(#gold)"/>` +
    `<text x="84" y="85" text-anchor="middle" font-size="19" font-weight="800" fill="#26241f">S</text>` +
    `<text x="110" y="85" font-size="20" font-weight="800" letter-spacing="2" fill="#2b2923">SEM ASSIST</text>` +
    `<text x="${W - 70}" y="85" text-anchor="end" font-size="19" font-weight="700" fill="#8b887e">${semester} · ${escapeHtml(monthYear)}</text>` +
    `<circle cx="${W / 2}" cy="250" r="118" fill="url(#gold)"/>` +
    `<text x="${W / 2}" y="296" text-anchor="middle" font-size="150" font-weight="800" fill="#26241f">${escapeHtml(PROFILE_NAME.slice(0, 1))}</text>` +
    `<text x="${W / 2}" y="430" text-anchor="middle" font-size="64" font-weight="800" fill="#2b2923">${escapeHtml(PROFILE_NAME)}</text>` +
    `<g transform="translate(${(W - semW) / 2}, 500)"><rect width="${semW}" height="46" rx="23" fill="#33322e"/><text x="${semW / 2}" y="31" text-anchor="middle" font-size="24" font-weight="700" fill="#f4f1e6">${semester}</text></g>` +
    badgeRects
      .map(
        (r, i) =>
          `<g><rect x="${r.x}" y="580" width="${r.w}" height="48" rx="24" fill="#33322e"/><circle cx="${r.x + 30}" cy="604" r="8" fill="${r.color}"/><text x="${r.x + 48}" y="611" font-size="23" font-weight="700" fill="#e9e7de">${escapeHtml(skills[i].name)}</text></g>`
      )
      .join("") +
    bioLines
      .map(
        (line, i) =>
          `<text x="${W / 2}" y="${684 + i * 40}" text-anchor="middle" font-size="27" font-weight="500" fill="#5a5851">${escapeHtml(line)}</text>`
      )
      .join("") +
    metrics
      .map((m, i) => {
        const x = metricX(i);
        return (
          `<g><text x="${x + metricW / 2}" y="780" text-anchor="middle" font-size="19" font-weight="700" letter-spacing="2" fill="#8b887e">${escapeHtml(m.label.toUpperCase())}</text>` +
          `<rect x="${x}" y="794" width="${metricW}" height="${metricH}" rx="20" fill="${m.fill}" stroke="#e3e1d7"/><text x="${x + metricW / 2}" y="856" text-anchor="middle" font-size="42" font-weight="800" fill="${m.ink}">${escapeHtml(m.value)}</text></g>`
        );
      })
      .join("") +
    `<rect x="80" y="960" width="920" height="300" rx="26" fill="#1a1e29"/>` +
    `<text x="110" y="1000" font-size="28" font-weight="800" fill="#f4f1e6">Study pulse</text>` +
    `<circle cx="950" cy="1000" r="7" fill="#f6ce50"/><text x="934" y="1006" text-anchor="end" font-size="20" font-weight="700" fill="#a7acb8">You</text>` +
    `<line x1="856" y1="1000" x2="908" y2="1000" stroke="#dfe3ec" stroke-width="3" stroke-dasharray="5 5"/><text x="900" y="1006" text-anchor="end" font-size="20" font-weight="700" fill="#a7acb8">Pace</text>` +
    `<polyline points="${pacePts}" fill="none" stroke="#dfe3ec" stroke-width="3" stroke-dasharray="6 6" opacity=".85"/>` +
    `<polyline points="${youPts}" fill="none" stroke="#f6ce50" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
    series.you
      .map((v, i) => `<circle cx="${cx(i)}" cy="${cy(v)}" r="8" fill="#f6ce50"/>`)
      .join("") +
    `<line x1="${cx(last)}" y1="${cy(series.you[last])}" x2="${cx(last)}" y2="${chartB + 2}" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<rect x="${bubbleX}" y="${cy(series.you[last]) - 46}" width="110" height="32" rx="16" fill="#f6ce50"/><text x="${bubbleX + 55}" y="${cy(series.you[last]) - 25}" text-anchor="middle" font-size="20" font-weight="800" fill="#332f1e">${series.you[last]} pts</text>` +
    series.labels
      .map((label, i) =>
        i === last
          ? `<circle cx="${cx(i)}" cy="${chartB + 26}" r="15" fill="#f6ce50"/><text x="${cx(i)}" y="${chartB + 32}" text-anchor="middle" font-size="16" font-weight="800" fill="#332f1e">${label}</text>`
          : `<text x="${cx(i)}" y="${chartB + 34}" text-anchor="middle" font-size="18" fill="#a7acb8">${label}</text>`
      )
      .join("") +
    `<text x="${W / 2}" y="1296" text-anchor="middle" font-size="19" font-weight="700" fill="#8b887e">SEM ASSIST · Placement-ready profile</text>` +
    `</svg>`
  );
}
async function svgToPngBlob(svgString, width, height) {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    return await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
function openShareCard() {
  const overlay = document.getElementById("shareOverlay");
  const preview = document.getElementById("sharePreview");
  if (!overlay || !preview) return;
  preview.innerHTML = buildProfileCardSvg(loadState());
  overlay.hidden = false;
}
function closeShareCard() {
  const overlay = document.getElementById("shareOverlay");
  if (overlay) overlay.hidden = true;
}
async function downloadSharePng() {
  const svgString = buildProfileCardSvg(loadState());
  try {
    const blob = await svgToPngBlob(svgString, 1080, 1350);
    if (!blob) {
      showToast("Could not build the image.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `sem-assist-profile-${todayKey()}.png`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    showToast("Profile card PNG downloaded.");
  } catch {
    showToast("Could not build the image.");
  }
}
async function copySharePng() {
  const svgString = buildProfileCardSvg(loadState());
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const blob = await svgToPngBlob(svgString, 1080, 1350);
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Profile card copied — paste it anywhere.");
        return;
      }
    } catch {
      /* fall through to download */
    }
  }
  downloadSharePng();
}
function renderProfile(state) {
  const stats = getStats(state);
  const badges = document.getElementById("profileBadges");
  if (badges) {
    badges.innerHTML = topSkills(state)
      .map(
        track =>
          `<span class="profile-badge" style="--dot:${track.color}"><i></i>${escapeHtml(track.name)}</span>`
      )
      .join("");
  }
  const role = document.getElementById("profileRole");
  if (role) {
    role.innerHTML =
      `<span id="profileSemesterText">${escapeHtml(state.profileSemester || "Semester 3")}</span>` +
      `<button class="profile-edit" data-edit-semester type="button" aria-label="Edit semester" title="Edit semester">✎</button>`;
  }
  const bio = document.getElementById("profileBio");
  if (bio) {
    const lead = topSkills(state)[0];
    const leadPart =
      stats.byTrack[lead.id].done > 0
        ? ` ${lead.name} leads the way.`
        : " The semester is still fresh.";
    bio.textContent =
      `${stats.done} of ${stats.total} checkpoints verified.${leadPart}`;
  }
  const metrics = document.getElementById("profileMetrics");
  if (metrics) {
    const focusDays =
      state.focus && typeof state.focus.days === "object" ? state.focus.days : {};
    const focusTotal = Object.values(focusDays).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
    const focusLabel =
      focusTotal >= 60
        ? `${Math.floor(focusTotal / 60)}h ${focusTotal % 60}m`
        : `${focusTotal}m`;
    metrics.innerHTML =
      `<div class="profile-metric yellow"><span>Checkpoints</span><b>${stats.done}/${stats.total}</b></div>` +
      `<div class="profile-metric slate"><span>Streak</span><b>${streak(state.activity)}d</b></div>` +
      `<div class="profile-metric striped"><span>Focus</span><b>${escapeHtml(focusLabel)}</b></div>` +
      `<div class="profile-metric white"><span>Proof</span><b>${stats.done * 10} pts</b></div>`;
  }
  const chart = document.getElementById("pulseChart");
  if (chart) chart.innerHTML = buildPulseSvg(weeklySeries(state));
}
function editSemester() {
  const role = document.getElementById("profileRole");
  if (!role) return;
  const input = document.createElement("input");
  input.className = "profile-semester-input";
  input.maxLength = 24;
  input.value = loadState().profileSemester || "Semester 3";
  input.setAttribute("aria-label", "Semester");
  role.innerHTML = "";
  role.appendChild(input);
  input.focus();
  input.select();
  const commit = () => {
    const value = input.value.trim();
    const state = loadState();
    state.profileSemester = value || "Semester 3";
    saveState(state);
    renderProfile(state);
  };
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      input.value = loadState().profileSemester || "Semester 3";
      renderProfile(loadState());
    }
  });
  input.addEventListener("blur", commit);
}
function updateSummary(state) {
  const stats = getStats(state);
  document.getElementById("headlineProgress").style.width = stats.percent + "%";
  document.getElementById("headVerified").textContent = stats.percent + "%";
  document.getElementById("statOpen").textContent = stats.total - stats.done;
  document.getElementById("statStreak").textContent = streak(state.activity);
  document.getElementById("statProof").textContent = stats.done * 10;
  document.getElementById("missionPercent").textContent = stats.percent + "%";
  document.getElementById("deviceProgress").textContent =
    `${stats.done} / ${stats.total}`;
  document.getElementById("workbenchCount").textContent =
    `${stats.done} completed`;
  document.getElementById("focusCount").textContent =
    `${stats.byTrack.python.done} / ${stats.byTrack.python.total}`;
  document
    .querySelectorAll("[data-head-percent]")
    .forEach(
      node =>
        (node.textContent =
          stats.byTrack[node.dataset.headPercent].percent + "%")
    );
  const trackSummary = document.getElementById("trackSummary");
  trackSummary.innerHTML = tracks
    .map(track => {
      const item = stats.byTrack[track.id];
      return (
        `<div class="track-row" style="--track:${track.color}">` +
        `<i></i><span>${track.name}</span>` +
        `<strong>${item.done}/${item.total}</strong>` +
        `<div class="mini-line"><span style="width:${item.percent}%"></span></div>` +
        `</div>`
      );
    })
    .join("");
  document.getElementById("customTaskCount").textContent =
    `${stats.customTotal - stats.customDone} open · ${stats.customTotal} total`;
  renderWeeklyProgress(state);
  renderActivity(state);
  renderCustomTasks(state);
  renderMissionQueue(state);
  renderReviewQueue(state);
  renderResources(state);
  renderProfile(state);
}
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]
  );
}
function validResourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function safeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#f6ce50";
}
function clampToCanvas(list, item, left, top) {
  const maxLeft = list.clientWidth - item.offsetWidth - 10;
  const maxTop = list.clientHeight - item.offsetHeight - 10;
  return {
    left: Math.max(10, Math.min(maxLeft, left)),
    top: Math.max(10, Math.min(maxTop, top)),
  };
}
function resourceSnapEnabled() {
  return localStorage.getItem(RESOURCE_SNAP_KEY) === "on";
}
function snapToGrid(value) {
  return Math.round(value / RESOURCE_SNAP) * RESOURCE_SNAP;
}
// Clamp to the canvas, then (when the snap toggle is on) round onto the same
// 18px grid the canvas dots use, re-clamping in case the snapped value pokes
// past an edge.
function settlePosition(list, item, left, top) {
  const clamped = clampToCanvas(list, item, left, top);
  if (!resourceSnapEnabled()) return clamped;
  return clampToCanvas(
    list,
    item,
    snapToGrid(clamped.left),
    snapToGrid(clamped.top)
  );
}
function persistResourcePosition(item) {
  const current = loadState();
  const resource = current.resources.find(
    entry => entry.id === item.dataset.resourceId
  );
  if (resource) {
    resource.x = parseFloat(item.style.left) || item.offsetLeft;
    resource.y = parseFloat(item.style.top) || item.offsetTop;
    saveState(current);
  }
}
function renderResources(state) {
  const list = document.getElementById("resourceList");
  const resources = Array.isArray(state.resources) ? state.resources : [];
  document.getElementById("resourceCount").textContent =
    `${resources.length} saved`;
  list.innerHTML = resources.length
    ? resources
        .map((resource, index) => {
          const url = validResourceUrl(resource.url);
          const x = Number.isFinite(resource.x)
            ? resource.x
            : 18 + (index % 3) * 238;
          const y = Number.isFinite(resource.y)
            ? resource.y
            : 18 + Math.floor(index / 3) * 138;
          const name = escapeHtml(resource.name);
          const escapedId = escapeHtml(resource.id);
          const descriptionHtml = resource.description
            ? `<p>${escapeHtml(resource.description)}</p>`
            : "";
          const linkHtml = url
            ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Open resource ↗</a>`
            : "<p>Link unavailable</p>";
          return (
            `<article class="resource-item" tabindex="0" data-resource-id="${escapedId}" style="left:${x}px;top:${y}px;border-left-color:${safeColor(resource.color)}" title="Move with the arrow keys; press Enter to save the position.">` +
            `<div><h3>${name}</h3>${descriptionHtml}${linkHtml}</div>` +
            `<button class="custom-delete" type="button" aria-label="Delete ${name}" title="Delete resource" data-resource-delete="${escapedId}">×</button>` +
            `</article>`
          );
        })
        .join("")
    : '<div class="custom-empty resource-empty">No resources saved yet. Add the next useful link you find.</div>';
  list
    .querySelectorAll("[data-resource-delete]")
    .forEach(button =>
      button.addEventListener("click", () =>
        deleteResource(button.dataset.resourceDelete)
      )
    );
  list.querySelectorAll(".resource-item").forEach(item =>
    item.addEventListener("pointerdown", event => {
      if (event.target.closest("a, button")) return;
      const rect = list.getBoundingClientRect();
      const startX = event.clientX - item.offsetLeft;
      const startY = event.clientY - item.offsetTop;
      item.setPointerCapture(event.pointerId);
      item.classList.add("dragging");
      const move = moveEvent => {
        const pos = settlePosition(
          list,
          item,
          moveEvent.clientX - rect.left - startX,
          moveEvent.clientY - rect.top - startY
        );
        item.style.left = `${pos.left}px`;
        item.style.top = `${pos.top}px`;
      };
      const end = () => {
        item.classList.remove("dragging");
        persistResourcePosition(item);
        item.removeEventListener("pointermove", move);
        item.removeEventListener("pointerup", end);
        item.removeEventListener("pointercancel", end);
      };
      item.addEventListener("pointermove", move);
      item.addEventListener("pointerup", end);
      item.addEventListener("pointercancel", end);
    })
  );
  list.querySelectorAll(".resource-item").forEach(item =>
    item.addEventListener("keydown", event => {
      if (event.target !== item) return;
      const step = event.shiftKey ? 50 : 10;
      const deltas = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const delta = deltas[event.key];
      if (delta) {
        event.preventDefault();
        const pos = settlePosition(
          list,
          item,
          parseFloat(item.style.left) + delta[0],
          parseFloat(item.style.top) + delta[1]
        );
        item.style.left = `${pos.left}px`;
        item.style.top = `${pos.top}px`;
        persistResourcePosition(item);
      } else if (event.key === "Enter") {
        event.preventDefault();
        persistResourcePosition(item);
        showToast("Position saved.");
      }
    })
  );
}
function formatDueDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function renderCustomTasks(state) {
  const list = document.getElementById("customTasks");
  const empty = document.getElementById("customEmpty");
  const tasks = Array.isArray(state.customTasks) ? state.customTasks : [];
  const today = todayKey();
  empty.hidden = tasks.length > 0;
  list.innerHTML = tasks
    .map(task => {
      const doneClass = task.completed ? "done" : "";
      const checkedAttr = task.completed ? "checked" : "";
      const cadenceLabel = task.cadence === "today" ? "Today" : "This week";
      const title = escapeHtml(task.title);
      const dueDate = task.dueDate ? String(task.dueDate) : null;
      const overdue = !task.completed && dueDate !== null && dueDate < today;
      const meta =
        dueDate === null
          ? `added ${task.createdAt}`
          : `Due ${dueDate === today ? "today" : formatDueDate(dueDate)}`;
      const overduePill = overdue ? '<em class="due-pill">Overdue</em>' : "";
      return (
        `<div class="custom-row ${doneClass}${overdue ? " overdue" : ""}">` +
        `<label class="custom-main">` +
        `<input class="check" type="checkbox" ${checkedAttr} data-custom-check="${task.id}" />` +
        `<span>${title}<small>${cadenceLabel} · ${meta}${overduePill}</small></span>` +
        `</label>` +
        `<button class="custom-delete" type="button" title="Delete task" aria-label="Delete ${title}" data-custom-delete="${task.id}">×</button>` +
        `</div>`
      );
    })
    .join("");
  list
    .querySelectorAll("[data-custom-check]")
    .forEach(input =>
      input.addEventListener("change", event =>
        toggleCustomTask(event.target.dataset.customCheck, event.target.checked)
      )
    );
  list
    .querySelectorAll("[data-custom-delete]")
    .forEach(button =>
      button.addEventListener("click", () =>
        deleteCustomTask(button.dataset.customDelete)
      )
    );
}
function renderActivity(state) {
  const grid = document.getElementById("activityCalendar");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 363 - start.getDay());
  grid.innerHTML = "";
  let active = 0,
    total = 0;
  Object.values(state.activity).forEach(value => {
    const n = Number(value) || 0;
    if (n) {
      active++;
      total += n;
    }
  });
  const sessionsByDay = {};
  (Array.isArray(state.focus.sessions) ? state.focus.sessions : []).forEach(
    session => {
      if (!session || !session.date) return;
      sessionsByDay[session.date] = sessionsByDay[session.date] || {
        minutes: 0,
        notes: [],
      };
      sessionsByDay[session.date].minutes += Number(session.minutes) || 0;
      if (session.note) {
        const trackName = session.track
          ? (tracks.find(track => track.id === session.track) || {}).name
          : null;
        sessionsByDay[session.date].notes.push(
          trackName ? `${trackName}: ${session.note}` : session.note
        );
      }
    }
  );
  for (let index = 0; index < 364; index++) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const count = Number(state.activity[key]) || 0;
    const level =
      count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    const dot = document.createElement("i");
    dot.className = "activity-dot" + (level ? ` level-${level}` : "");
    let title = `${key}: ${count} task ${count === 1 ? "completion" : "completions"}`;
    const logged = sessionsByDay[key];
    if (logged && logged.minutes > 0) {
      title += ` · ${formatMinutes(logged.minutes)} focused`;
      if (logged.notes.length) title += ` — “${logged.notes[0]}”`;
    }
    dot.title = title;
    grid.appendChild(dot);
  }
  updateCalendarSummary(state);
}
function updateCalendarSummary(state) {
  let active = 0,
    total = 0;
  Object.values(state.activity || {}).forEach(value => {
    const n = Number(value) || 0;
    if (n) {
      active++;
      total += n;
    }
  });
  const focusTotal = Object.values(
    state.focus && typeof state.focus.days === "object" ? state.focus.days : {}
  ).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const summary = active
    ? `${active} active days · ${total} completions`
    : "No activity recorded yet.";
  document.getElementById("calendarSummary").textContent = focusTotal
    ? `${summary} · ${formatMinutes(focusTotal)} focused`
    : summary;
}
function toggleTask(id, trackId, checked) {
  const state = loadState();
  const wasChecked = Boolean(state.completed[id]);
  state.completed[id] = checked;
  if (checked && !wasChecked) {
    const date = todayKey();
    state.completedAt[id] = date;
    // A fresh verification restarts the spaced-repetition clock.
    if (state.reviews)
      Object.keys(state.reviews).forEach(key => {
        if (key.startsWith(`${id}@`)) delete state.reviews[key];
      });
    state.activity[date] = (Number(state.activity[date]) || 0) + 1;
    showToast(
      `${tracks.find(track => track.id === trackId).name} checkpoint verified.`
    );
    awardPoints(CHECKPOINT_POINTS);
  } else if (!checked && wasChecked && state.completedAt[id]) {
    const date = state.completedAt[id];
    state.activity[date] = Math.max(0, (Number(state.activity[date]) || 0) - 1);
    if (!state.activity[date]) delete state.activity[date];
    delete state.completedAt[id];
    awardPoints(-CHECKPOINT_POINTS);
  }
  saveState(state);
  renderTracks(state);
  updateSummary(state);
}
// Spaced-repetition review: a verified checkpoint becomes a self-test again at
// 3, 7, and 14 days. Reviews live in state.reviews ("<id>@<milestone>" → date)
// and never mutate completed/activity, so stats and streaks stay untouched.
function daysSince(key) {
  return Math.round((Date.parse(todayKey()) - Date.parse(key)) / 86400000);
}
function reviewDue(state, id) {
  const completedDate = state.completedAt && state.completedAt[id];
  if (!completedDate) return null;
  const age = daysSince(completedDate);
  if (age < 0) return null;
  const reviewed = state.reviews || {};
  for (const milestone of REVIEW_SCHEDULE) {
    const key = `${id}@${milestone}`;
    if (reviewed[key]) continue;
    return age >= milestone ? milestone : null;
  }
  return null;
}
function markReviewSolid(state, id) {
  const milestone = reviewDue(state, id);
  if (!milestone) return false;
  if (!state.reviews) state.reviews = {};
  state.reviews[`${id}@${milestone}`] = todayKey();
  return true;
}
function markReviewRedo(state, id) {
  if (!state.completedAt || !state.completedAt[id]) return false;
  state.completedAt[id] = todayKey(); // practice again: restart the cycle
  if (state.reviews)
    Object.keys(state.reviews).forEach(key => {
      if (key.startsWith(`${id}@`)) delete state.reviews[key];
    });
  return true;
}
function renderReviewQueue(state) {
  const queue = document.getElementById("reviewQueue");
  const empty = document.getElementById("reviewEmpty");
  const waiting = document.getElementById("reviewWait");
  const count = document.getElementById("reviewCount");
  if (!queue || !empty) return;
  const due = [];
  tracks.forEach(track =>
    track.tasks.forEach((task, index) => {
      const id = taskId(track, index);
      const milestone = reviewDue(state, id);
      if (milestone) due.push({ id, track, label: task[0], milestone });
    })
  );
  const shown = due.slice(0, 5); // a daily ritual, not a backlog dump
  empty.hidden = due.length > 0;
  queue.hidden = due.length === 0;
  if (count) count.textContent = due.length ? `${due.length} due` : "Nothing due";
  if (waiting) waiting.hidden = due.length <= 5;
  if (waiting) waiting.textContent = due.length > 5
    ? `${due.length - 5} more waiting — they stay due until you practise them.`
    : "";
  queue.innerHTML = shown
    .map(
      item =>
        `<div class="review-row" style="--track:${item.track.color}">` +
        `<i class="review-dot"></i>` +
        `<span class="review-main"><b>${escapeHtml(item.label)}</b>` +
        `<small>${escapeHtml(item.track.name)} · due ${item.milestone}d after ✓</small></span>` +
        `<span class="review-actions">` +
        `<button class="review-solid" type="button" data-review-solid="${item.id}" title="Recalled it from memory">✓ Solid</button>` +
        `<button class="review-redo" type="button" data-review-redo="${item.id}" title="Needs practice again">↺ Redo</button>` +
        `</span></div>`
    )
    .join("");
}
function toggleCustomTask(id, checked) {
  const state = loadState();
  const task = state.customTasks.find(item => item.id === id);
  if (!task) return;
  task.completed = checked;
  if (checked) {
    const date = todayKey();
    task.completedAt = date;
    state.activity[date] = (Number(state.activity[date]) || 0) + 1;
    showToast("Personal task completed.");
  } else if (task.completedAt) {
    const date = task.completedAt;
    state.activity[date] = Math.max(0, (Number(state.activity[date]) || 0) - 1);
    if (!state.activity[date]) delete state.activity[date];
    task.completedAt = null;
  }
  saveState(state);
  updateSummary(state);
}
function deleteCustomTask(id) {
  const state = loadState();
  const task = state.customTasks.find(item => item.id === id);
  if (!task) return;
  if (task.completed && task.completedAt) {
    const date = task.completedAt;
    state.activity[date] = Math.max(0, (Number(state.activity[date]) || 0) - 1);
    if (!state.activity[date]) delete state.activity[date];
  }
  state.customTasks = state.customTasks.filter(item => item.id !== id);
  saveState(state);
  updateSummary(state);
  showToast("Personal task removed.");
}
function addCustomTask(event) {
  event.preventDefault();
  const input = document.getElementById("customTaskInput");
  const title = input.value.trim();
  if (!title) return;
  const state = loadState();
  state.customTasks.push({
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    cadence: document.getElementById("customCadence").value,
    dueDate: document.getElementById("customDue").value || null,
    createdAt: todayKey(),
    completed: false,
    completedAt: null,
  });
  saveState(state);
  input.value = "";
  renderTracks(state);
  updateSummary(state);
  showToast("Personal task added.");
  input.focus();
}
function addResource(event) {
  event.preventDefault();
  const name = document.getElementById("resourceName").value.trim();
  const url = validResourceUrl(
    document.getElementById("resourceUrl").value.trim()
  );
  const description = document
    .getElementById("resourceDescription")
    .value.trim();
  const color = document.getElementById("resourceColor").value;
  if (!name || !url) {
    showToast("Add a name and a valid http(s) link.");
    return;
  }
  const state = loadState();
  const index = state.resources.length;
  state.resources.push({
    id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    url,
    description,
    color,
    x: 18 + (index % 3) * 238,
    y: 18 + Math.floor(index / 3) * 138,
  });
  saveState(state);
  document.getElementById("resourceForm").reset();
  document.getElementById("resourceColor").value = "#f6ce50";
  updateSummary(state);
  showToast("Resource saved to your canvas.");
  document.getElementById("resourceName").focus();
}
function deleteResource(id) {
  const state = loadState();
  state.resources = state.resources.filter(resource => resource.id !== id);
  saveState(state);
  updateSummary(state);
  showToast("Resource removed.");
}
function applyFilters() {
  const term = document.getElementById("search").value.toLowerCase().trim();
  const filtering = activeFilter !== "all" || term.length > 0;
  let visible = 0;
  document.querySelectorAll(".track-card").forEach(card => {
    let cardVisible = 0;
    card.querySelectorAll(".task-row").forEach(row => {
      const isDone = row.classList.contains("done");
      const filterOk =
        activeFilter === "all" ||
        (activeFilter === "done" && isDone) ||
        (activeFilter === "open" && !isDone);
      const match = row.textContent.toLowerCase().includes(term);
      const show = filterOk && match;
      row.classList.toggle("hidden", !show);
      if (show) {
        visible++;
        cardVisible++;
      }
    });
    // While searching/filtering, expand every card that still has matches so
    // results stay visible without hover; otherwise fall back to hover tiles.
    card.classList.toggle("expanded", filtering && cardVisible > 0);
  });
  document.getElementById("emptyState").classList.toggle("show", visible === 0);
}
// Focus journal: when a finished run has recorded time, ask what it was about
// and which track it belongs to. The note and tag are written onto the session
// that endFocusRun already pushed, so skipping is always safe.
function openJournalPrompt(minutes) {
  const overlay = document.getElementById("journalOverlay");
  if (!overlay || minutes <= 0) return;
  const select = document.getElementById("journalTrack");
  if (!select.options.length) {
    const option = (value, label) => {
      const element = document.createElement("option");
      element.value = value;
      element.textContent = label;
      return element;
    };
    tracks.forEach(track => select.appendChild(option(track.id, track.name)));
    select.appendChild(option("other", "Other / general"));
  }
  document.getElementById("journalTitle").textContent =
    `${formatMinutes(minutes)} of focus — what did you work on?`;
  const state = loadState();
  const queued = tracks.some(track => track.id === state.queueFocus)
    ? state.queueFocus
    : "other";
  select.value = queued;
  document.getElementById("journalNote").value = "";
  journalMinutes = minutes;
  overlay.hidden = false;
  document.getElementById("journalNote").focus();
}
function closeJournalPrompt() {
  document.getElementById("journalOverlay").hidden = true;
  journalMinutes = 0;
}
function saveJournalFocus() {
  if (!journalMinutes) return;
  const note = document.getElementById("journalNote").value.trim();
  const trackId = document.getElementById("journalTrack").value;
  const state = loadState();
  const sessions = Array.isArray(state.focus.sessions)
    ? state.focus.sessions
    : [];
  const last = sessions[sessions.length - 1];
  let savedTrack = null;
  if (last) {
    savedTrack =
      trackId !== "other" && tracks.some(track => track.id === trackId)
        ? trackId
        : null;
    last.track = savedTrack;
    last.note = note || null;
    saveState(state);
  }
  closeJournalPrompt();
  renderFocusTotals(state);
  renderActivity(state);
  const track = tracks.find(item => item.id === savedTrack);
  showToast(track ? `${track.name} focus logged.` : "Focus session saved.");
}
function skipJournalPrompt() {
  if (!journalMinutes) return;
  closeJournalPrompt();
}
function commitFocusRun() {
  const delta = Math.round(focusSeconds / 60) - focusCommitted;
  if (delta <= 0) return;
  const state = loadState();
  addFocusMinutes(state, todayKey(), delta);
  focusCommitted += delta;
  saveState(state);
  renderFocusTotals(state);
  updateCalendarSummary(state);
}
function endFocusRun() {
  commitFocusRun();
  const minutes = focusCommitted;
  if (minutes > 0) {
    const state = loadState();
    state.focus.sessions.push({ date: todayKey(), minutes });
    saveState(state);
    awardPoints(minutes);
  }
  focusCommitted = 0;
}
function stopFocusRun() {
  const minutes = focusCommitted;
  endFocusRun();
  if (minutes > 0) openJournalPrompt(minutes);
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
function setTimer() {
  document.getElementById("timerText").textContent = formatTime(focusSeconds);
  document
    .getElementById("timerRing")
    .style.setProperty(
      "--ring-progress",
      `${Math.min(100, (focusSeconds / 1500) * 100)}%`
    );
}
async function applySession(user) {
  currentUser = user || null;
  document.getElementById("authScreen").hidden = Boolean(user);
  document.getElementById("signedIn").hidden = !user;
  if (!user) {
    currentAccessToken = null;
    currentState = loadLocalState();
    renderTracks(currentState);
    updateSummary(currentState);
    refreshLeaderboard();
    return;
  }
  document.getElementById("signedInEmail").textContent =
    user.email || "Signed in";
  const sb = await ensureSupabase();
  if (!sb) {
    currentAccessToken = null;
    currentState = loadLocalState();
    renderTracks(currentState);
    updateSummary(currentState);
    refreshLeaderboard();
    return;
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  currentAccessToken = session?.access_token || null;
  const { data, error } = await sb
    .from("study_progress")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  currentState =
    !error && data?.state ? normalizeState(data.state) : loadLocalState();
  renderTracks(currentState);
  updateSummary(currentState);
  refreshLeaderboard();
  if (!data?.state) saveState(currentState);
}
function setAuthMode(signup) {
  document.getElementById("authForm").dataset.mode = signup
    ? "signup"
    : "signin";
  document.getElementById("authTitle").textContent = signup
    ? "Create your account"
    : "Welcome back";
  document.getElementById("authDescription").textContent = signup
    ? "Your study progress will be securely saved to your account."
    : "Sign in to keep your study progress private and available on every device.";
  document.getElementById("authSubmit").textContent = signup
    ? "Create account"
    : "Sign in";
  document.getElementById("authSwitch").textContent = signup
    ? "Already have an account? Sign in"
    : "Need an account? Sign up";
  document.getElementById("authPassword").autocomplete = signup
    ? "new-password"
    : "current-password";
  document.getElementById("authMessage").textContent = "";
}
async function handleAuth(event) {
  event.preventDefault();
  const sb = await ensureSupabase();
  const cfg = getSupabaseConfig();
  if (!sb || !cfg) {
    document.getElementById("authMessage").textContent =
      "Supabase is not configured yet. Add your project URL and publishable key to supabase-config.js.";
    return;
  }
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const signup = document.getElementById("authForm").dataset.mode === "signup";
  const message = document.getElementById("authMessage");
  message.textContent = "Working…";
  const result = signup
    ? await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: cfg.redirectUrl },
      })
    : await sb.auth.signInWithPassword({ email, password });
  if (result.error) {
    message.textContent = result.error.message;
    return;
  }
  message.textContent =
    signup && !result.data.session
      ? "Check your email to confirm your account, then sign in."
      : "Signed in successfully.";
}
// Builds a self-contained, print-ready A4 report from the current state. It is
// shown in a sandboxed iframe and printed via the browser's own Print → Save as
// PDF, so no PDF dependency or rasterization is needed.
function buildSemesterReport(state) {
  const stats = getStats(state);
  const focusDays =
    state.focus && typeof state.focus.days === "object" ? state.focus.days : {};
  const focusTotal = Object.values(focusDays).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
  const activeDays = Object.values(state.activity || {}).filter(
    value => Number(value) > 0
  ).length;
  const sessions = Array.isArray(state.focus.sessions)
    ? state.focus.sessions
    : [];
  const journals = [...sessions].reverse().slice(0, 6);
  const resources = Array.isArray(state.resources) ? state.resources : [];
  const person =
    currentUser && currentUser.email
      ? String(currentUser.email).split("@")[0]
      : "Local progress";
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const journalRows = journals
    .map(session => {
      const track = session.track
        ? tracks.find(item => item.id === session.track)
        : null;
      const trackName = track ? track.name : "General";
      const color = track ? track.color : "#c9c6bb";
      const label = session.note || "(no note)";
      return (
        `<div class="ledger-row"><i class="ld" style="--l:${color}"></i>` +
        `<span class="ledger-date">${escapeHtml(session.date)}</span>` +
        `<b>${escapeHtml(trackName)}</b><span>${escapeHtml(label)}</span>` +
        `<em>${formatMinutes(Number(session.minutes) || 0)}</em></div>`
      );
    })
    .join("");
  const trackRows = tracks
    .map(track => {
      const item = stats.byTrack[track.id];
      return (
        `<div class="pt-row" style="--t:${track.color}"><span class="pt-name"><i></i>${escapeHtml(track.name)}</span>` +
        `<div class="pt-rail"><span style="width:${item.percent}%"></span></div>` +
        `<strong>${item.done}/${item.total}</strong></div>`
      );
    })
    .join("");
  const shelf = resources
    .slice(0, 4)
    .map(item => `<li>${escapeHtml(String((item && item.name) || ""))}</li>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Semester evidence report</title>
<style>
@page { size: A4; margin: 9mm 11mm 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.5px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #2a2822; background: white; }
.topbar { height: 6px; border-radius: 4px 4px 0 0; background: linear-gradient(90deg, #f6ce50, #e89a3c); margin-bottom: 14px; }
.mast { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 11px; border-bottom: 2px solid #f6ce50; margin-bottom: 13px; }
.brand { display: flex; align-items: center; gap: 10px; }
.mark { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(140deg, #f6ce50, #e89a3c); color: #26241f; font: 800 20px/1 -apple-system, "Segoe UI", Arial, sans-serif; }
.brand h1 { margin: 0; font-size: 22px; letter-spacing: -.6px; }
.brand .sub { color: #6f6c60; font-size: 9px; letter-spacing: .2px; margin-top: 2px; }
.who { text-align: right; }
.who b { display: block; font-size: 13px; letter-spacing: -.2px; }
.who span { display: block; color: #8a867b; font-size: 9px; margin-top: 3px; }
.stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 6px; }
.stat { border: 1px solid #ebe6d8; border-radius: 11px; padding: 9px 10px; background: #fff; }
.stat b { display: block; font-size: 17px; letter-spacing: -.4px; line-height: 1.1; }
.stat span { display: block; margin-top: 3px; color: #7b776c; font-size: 7px; text-transform: uppercase; letter-spacing: .7px; }
.stat.hero { border-color: #f0d273; background: linear-gradient(160deg, #fbf3d4, #f8e7ab); }
.stat.hero b { color: #3a3108; }
.section-title { display: flex; align-items: center; gap: 7px; margin: 13px 0 7px; font-size: 10px; text-transform: uppercase; letter-spacing: .8px; color: #6f6c60; }
.section-title::before { content: ""; width: 9px; height: 9px; border-radius: 2.5px; background: #f6ce50; }
.panel { border: 1px solid #ebe6d8; border-radius: 12px; padding: 10px 12px; background: #fdfdfa; page-break-inside: avoid; }
.panel h3 { margin: 0 0 7px; font-size: 8.5px; text-transform: uppercase; letter-spacing: .7px; color: #6f6c60; }
.panel p { margin: 0; color: #6f6c60; }
.pt-row { display: grid; grid-template-columns: 150px minmax(0, 1fr) 34px; align-items: center; gap: 9px; padding: 3.5px 0; }
.pt-name { display: flex; align-items: center; min-width: 0; }
.pt-name i { display: inline-block; width: 7px; height: 7px; border-radius: 2px; background: var(--t); margin-right: 6px; }
.pt-rail { height: 6px; border-radius: 999px; background: #ece7d8; overflow: hidden; }
.pt-rail span { display: block; height: 100%; border-radius: 999px; background: var(--t); }
.pt-row strong { text-align: right; font-size: 10px; }
.two { display: grid; grid-template-columns: 1.08fr 1fr; gap: 10px; margin-top: 4px; }
.ledger-row { display: grid; grid-template-columns: 6px 60px 62px minmax(0, 1fr) 36px; gap: 7px; align-items: center; padding: 4px 0; border-top: 1px dotted #e7e1d1; }
.ledger-row .ld { width: 6px; height: 18px; border-radius: 999px; background: var(--l, #c9c6bb); }
.ledger-row .ledger-date { color: #8a867b; }
.ledger-row b { font-size: 9.5px; }
.ledger-row em { font-style: normal; text-align: right; font-weight: 700; }
.shelf { display: flex; flex-wrap: wrap; gap: 5px; padding: 0; margin: 7px 0 0; list-style: none; }
.shelf li { border: 1px solid #e9e4d4; border-radius: 999px; padding: 3px 9px; font-size: 8.5px; background: #fff; }
.foot { display: flex; justify-content: space-between; align-items: center; margin-top: 13px; border-top: 1px solid #ece7d8; padding-top: 8px; color: #8a867b; font-size: 8px; }
.foot .mark-chip { display: inline-flex; align-items: center; gap: 6px; color: #6f6c60; }
.foot .mark-chip::before { content: ""; width: 9px; height: 9px; border-radius: 3px; background: linear-gradient(140deg, #f6ce50, #e89a3c); }
</style></head><body>
<div class="topbar"></div>
<div class="mast">
<div class="brand"><span class="mark">S</span><div><h1>SEM ASSIST</h1><div class="sub">Semester evidence report</div></div></div>
<div class="who"><b>${escapeHtml(person)}</b><span>${escapeHtml(today)}</span></div>
</div>
<div class="stats">
<div class="stat hero"><b>${stats.percent}%</b><span>Verified</span></div>
<div class="stat"><b>${stats.done}/${stats.total}</b><span>Checkpoints</span></div>
<div class="stat"><b>${streak(state.activity)}</b><span>Day streak</span></div>
<div class="stat"><b>${stats.done * 10}</b><span>Proof points</span></div>
<div class="stat"><b>${formatMinutes(focusTotal)}</b><span>Focused</span></div>
<div class="stat"><b>${activeDays}</b><span>Active days</span></div>
</div>
<div class="section-title">Semester pulse</div>
<div class="panel">${trackRows}</div>
<div class="two">
<div class="panel"><h3>Deep-work ledger</h3>${journalRows || "<p>No focus sessions journaled yet.</p>"}</div>
<div class="panel"><h3>Reference shelf</h3><p>${stats.customDone}/${stats.customTotal} personal tasks · ${resources.length} resources saved</p>${shelf ? `<ul class="shelf">${shelf}</ul>` : ""}</div>
</div>
<div class="foot"><span>Prepared with SEM ASSIST on ${escapeHtml(today)}.</span><span class="mark-chip">Evidence kept locally in this browser</span></div>
</body></html>`;
}
async function init() {
  initCookieBanner();
  const snapToggle = document.getElementById("resourceSnap");
  if (snapToggle) {
    snapToggle.checked = localStorage.getItem(RESOURCE_SNAP_KEY) === "on";
    snapToggle.addEventListener("change", () =>
      localStorage.setItem(RESOURCE_SNAP_KEY, snapToggle.checked ? "on" : "off")
    );
  }
  document.querySelectorAll("[data-scroll]").forEach(button =>
    button.addEventListener("click", () => {
      document
        .getElementById(button.dataset.scroll)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      document
        .querySelectorAll(".nav-button")
        .forEach(nav => nav.classList.toggle("active", nav === button));
    })
  );
  document.querySelectorAll(".filter").forEach(button =>
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document
        .querySelectorAll(".filter")
        .forEach(item => item.classList.toggle("active", item === button));
      applyFilters();
    })
  );
  // Tiles expand on click: toggle when the tile (head/chrome) is clicked, but
  // never when the click targets the task list or an interactive control.
  document.getElementById("checkpoints").addEventListener("click", event => {
    const card = event.target.closest(".track-card");
    if (!card) return;
    if (event.target.closest(".task-list, a, input, button")) return;
    const open = card.classList.toggle("open");
    card.setAttribute("aria-expanded", String(open));
    // A checkbox left focused inside the tile would keep it expanded via
    // :focus-within, so drop focus when collapsing.
    if (!open && card.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });
  // Keyboard parity: Enter/Space on the focused tile header toggles it.
  document.getElementById("checkpoints").addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("a, input, button")) return;
    const head = event.target.closest(".track-head");
    if (!head) return;
    event.preventDefault();
    const card = head.closest(".track-card");
    const open = card.classList.toggle("open");
    card.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("showOpen").addEventListener("click", () => {
    activeFilter = "open";
    document
      .querySelectorAll(".filter")
      .forEach(item =>
        item.classList.toggle("active", item.dataset.filter === "open")
      );
    applyFilters();
    document
      .getElementById("workbench")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("search").addEventListener("input", applyFilters);
  // Keyboard shortcuts: j/k move the checkpoint cursor, Space toggles it, /
  // focuses search, t starts or pauses the focus timer. Never while typing.
  document.addEventListener("keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const editing =
      target instanceof HTMLElement &&
      !!target.closest("input, textarea, select, [contenteditable]");
    if (editing) return;
    // While the focus journal is open, its own Enter/Escape handling wins.
    const journalOverlay = document.getElementById("journalOverlay");
    const reportOverlay = document.getElementById("reportOverlay");
    const shareOverlay = document.getElementById("shareOverlay");
    if (journalOverlay && !journalOverlay.hidden) return;
    if (reportOverlay && !reportOverlay.hidden) return;
    if (shareOverlay && !shareOverlay.hidden) return;
    if (event.key === "/") {
      event.preventDefault();
      const search = document.getElementById("search");
      search?.focus();
      search?.select();
    } else if (event.key === "j" || event.key === "k") {
      event.preventDefault();
      moveKeyboardCursor(event.key === "j" ? 1 : -1);
    } else if (event.key === "t") {
      event.preventDefault();
      toggleFocusTimer();
    } else if (event.key === " ") {
      // Only when focus is on the page itself (not a button, link, or tile),
      // so native Space activation of focused controls keeps working.
      if (target === document.body || target === document.documentElement) {
        event.preventDefault();
        toggleKeyboardCursor();
      }
    }
  });
  // Checkpoint queue: each row verifies the underlying checkpoint in one click,
  // and the focus select chooses which track the queue draws from (persisted).
  document.getElementById("missionQueue").addEventListener("click", event => {
    const row = event.target.closest("[data-qid]");
    if (!row) return;
    toggleTask(row.dataset.qid, row.dataset.track, true);
  });
  document.getElementById("queueFocus").addEventListener("change", event => {
    const state = loadState();
    state.queueFocus = event.target.value || "all";
    saveState(state);
    renderMissionQueue(state);
  });
  document
    .getElementById("customForm")
    .addEventListener("submit", addCustomTask);
  document
    .getElementById("resourceForm")
    .addEventListener("submit", addResource);
  document.getElementById("timerStart").addEventListener("click", () => {
    if (!timerId)
      timerId = setInterval(() => {
        focusSeconds++;
        setTimer();
        if (focusSeconds % 60 === 0) commitFocusRun();
      }, 1000);
  });
  document.getElementById("timerPause").addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    stopFocusRun();
  });
  document.getElementById("timerReset").addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    stopFocusRun();
    focusSeconds = 0;
    setTimer();
  });
  const journalOverlayEl = document.getElementById("journalOverlay");
  document.getElementById("journalSave").addEventListener("click", saveJournalFocus);
  document.getElementById("journalSkip").addEventListener("click", skipJournalPrompt);
  journalOverlayEl.addEventListener("click", event => {
    if (event.target === journalOverlayEl) skipJournalPrompt();
  });
  journalOverlayEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      skipJournalPrompt();
    } else if (event.key === "Enter" && event.target.id === "journalNote") {
      event.preventDefault();
      saveJournalFocus();
    }
  });
  // Review mode: mark a due checkpoint as recalled solid, or redo it (which
  // restarts its spaced-repetition clock). Both rerender through updateSummary.
  document.getElementById("reviewQueue").addEventListener("click", event => {
    const solid = event.target.closest("[data-review-solid]");
    const redo = event.target.closest("[data-review-redo]");
    if (!solid && !redo) return;
    const state = loadState();
    if (solid) {
      if (markReviewSolid(state, solid.dataset.reviewSolid)) {
        saveState(state);
        updateSummary(state);
        showToast("Marked solid — recalled from memory.");
      }
    } else if (markReviewRedo(state, redo.dataset.reviewRedo)) {
      saveState(state);
      updateSummary(state);
      showToast("Redo scheduled — the 3-day clock restarts.");
    }
  });
  // Semester report: preview a print-ready A4 sheet in an iframe and let the
  // browser's Print dialog do the PDF export.
  const reportOverlayEl = document.getElementById("reportOverlay");
  const reportFrame = document.getElementById("reportFrame");
  document.getElementById("reportOpen").addEventListener("click", () => {
    reportFrame.srcdoc = buildSemesterReport(loadState());
    reportOverlayEl.hidden = false;
    document.getElementById("reportClose").focus();
  });
  document.getElementById("reportClose").addEventListener("click", () => {
    reportOverlayEl.hidden = true;
  });
  document.getElementById("reportPrint").addEventListener("click", () => {
    const frameWindow = reportFrame.contentWindow;
    if (frameWindow && typeof frameWindow.print === "function") {
      frameWindow.focus();
      frameWindow.print();
    }
  });
  reportOverlayEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      reportOverlayEl.hidden = true;
    }
  });
  // Share profile card: preview the SVG card and export it as a PNG (copy or
  // download) for placement-prep conversations.
  const shareOverlayEl = document.getElementById("shareOverlay");
  if (shareOverlayEl) {
    document.getElementById("shareProfile").addEventListener("click", () => {
      openShareCard();
      document.getElementById("shareClose").focus();
    });
    document.getElementById("shareClose").addEventListener("click", closeShareCard);
    document.getElementById("sharePng").addEventListener("click", downloadSharePng);
    document.getElementById("shareCopy").addEventListener("click", copySharePng);
    shareOverlayEl.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        shareOverlayEl.hidden = true;
      }
    });
  }
  document.getElementById("exportData").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), state: loadState() },
            null,
            2
          ),
        ],
        { type: "application/json" }
      )
    );
    link.download = "sem-assist-progress.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Progress export prepared.");
  });
  document.getElementById("resetData").addEventListener("click", () => {
    if (
      confirm(
        "Reset all checkpoint and activity data? Export first if you want a backup."
      )
    ) {
      const state = defaultState();
      saveState(state);
      renderTracks(state);
      updateSummary(state);
      showToast("Fresh dashboard, same semester goal.");
    }
  });
  document.getElementById("authForm").addEventListener("submit", handleAuth);
  document
    .getElementById("authSwitch")
    .addEventListener("click", () =>
      setAuthMode(document.getElementById("authForm").dataset.mode !== "signup")
    );
  document.getElementById("signOut").addEventListener("click", () => {
    ensureSupabase().then(sb => sb?.auth.signOut());
  });
  const profileRole = document.getElementById("profileRole");
  if (profileRole) {
    profileRole.addEventListener("click", event => {
      if (event.target.closest("[data-edit-semester]")) editSemester();
    });
  }
  const boardNameSave = document.getElementById("leaderboardNameSave");
  if (boardNameSave) {
    boardNameSave.addEventListener("click", saveLeaderboardName);
    document.getElementById("leaderboardName").addEventListener("keydown", event => {
      if (event.key === "Enter") saveLeaderboardName();
    });
  }
  setAuthMode(false);
  setTimer();
  currentState = loadLocalState();
  renderTracks(currentState);
  updateSummary(currentState);
  refreshLeaderboard();
  window.addEventListener("pagehide", keepaliveFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") keepaliveFlush();
  });
  if (!(await ensureSupabase())) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await applySession(session?.user);
  supabase.auth.onAuthStateChange((_event, session) =>
    applySession(session?.user)
  );
}
// init() is intentionally NOT called here. The browser boot file
// (study-dashboard-boot.js) imports init and runs it so this module can be
// imported by tests without side effects.
export {
  STORAGE_KEY,
  LEGACY_KEY,
  COOKIE_CONSENT_KEY,
  initCookieBanner,
  tracks,
  taskId,
  dateKey,
  todayKey,
  defaultState,
  migrateLegacy,
  normalizeState,
  loadLocalState,
  loadState,
  saveState,
  flushCloudSave,
  getStats,
  nextUp,
  streak,
  escapeHtml,
  validResourceUrl,
  safeColor,
  init,
  applySession,
  renderTracks,
  updateSummary,
  toggleTask,
  formatTime,
  getSupabaseConfig,
  ensureSupabase,
  setSupabaseClientFactory,
  keepaliveFlush,
  applyFilters,
  formatMinutes,
  addFocusMinutes,
  reviewDue,
  markReviewSolid,
  markReviewRedo,
  buildSemesterReport,
  weekStartKey,
  refreshLeaderboard,
  weeklySeries,
  renderProfile,
  buildProfileCardSvg,
  wrapLines,
};
