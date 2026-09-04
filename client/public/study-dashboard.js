// The Supabase client is created lazily via ensureSupabase() (dynamic import), so this
// module can also be imported in a Node test environment without fetching esm.sh.
const STORAGE_KEY = "aster-study-dashboard-v3";
const LEGACY_KEY = "mission-cs-study-dashboard-v1";
const COOKIE_CONSENT_KEY = "semassist-cookie-consent";
const RESOURCE_SNAP_KEY = "semassist-resource-snap";
const RESOURCE_SNAP = 18;
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
let timerId = null;
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
function defaultState() {
  return {
    completed: {},
    completedAt: {},
    activity: {},
    customTasks: [],
    resources: [],
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
  return { completed, completedAt, activity, customTasks: [], resources: [] };
}
function normalizeState(state) {
  return {
    ...defaultState(),
    ...state,
    customTasks: Array.isArray(state?.customTasks) ? state.customTasks : [],
    resources: Array.isArray(state?.resources) ? state.resources : [],
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
function renderTracks(state) {
  const container = document.getElementById("checkpoints");
  container.innerHTML = "";
  const stats = getStats(state);
  tracks.forEach(track => {
    const card = document.createElement("article");
    card.className = "track-card wide";
    card.id = track.id;
    card.style.setProperty("--track", track.color);
    const source = track.source
      ? `<a class="source-link" href="${track.source}" target="_blank" rel="noreferrer">${track.sourceLabel || "roadmap.sh ↗"}</a>`
      : "";
    card.innerHTML =
      `<header class="track-head">` +
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
  renderResources(state);
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
function renderCustomTasks(state) {
  const list = document.getElementById("customTasks");
  const empty = document.getElementById("customEmpty");
  const tasks = Array.isArray(state.customTasks) ? state.customTasks : [];
  empty.hidden = tasks.length > 0;
  list.innerHTML = tasks
    .map(task => {
      const doneClass = task.completed ? "done" : "";
      const checkedAttr = task.completed ? "checked" : "";
      const cadenceLabel = task.cadence === "today" ? "Today" : "This week";
      const title = escapeHtml(task.title);
      return (
        `<div class="custom-row ${doneClass}">` +
        `<label class="custom-main">` +
        `<input class="check" type="checkbox" ${checkedAttr} data-custom-check="${task.id}" />` +
        `<span>${title}<small>${cadenceLabel} · added ${task.createdAt}</small></span>` +
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
  for (let index = 0; index < 364; index++) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const count = Number(state.activity[key]) || 0;
    const level =
      count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    const dot = document.createElement("i");
    dot.className = "activity-dot" + (level ? ` level-${level}` : "");
    dot.title = `${key}: ${count} task ${count === 1 ? "completion" : "completions"}`;
    grid.appendChild(dot);
  }
  document.getElementById("calendarSummary").textContent = active
    ? `${active} active days · ${total} completions`
    : "No activity recorded yet.";
}
function toggleTask(id, trackId, checked) {
  const state = loadState();
  state.completed[id] = checked;
  if (checked) {
    const date = todayKey();
    state.completedAt[id] = date;
    state.activity[date] = (Number(state.activity[date]) || 0) + 1;
    showToast(
      `${tracks.find(track => track.id === trackId).name} checkpoint verified.`
    );
  } else if (state.completedAt[id]) {
    const date = state.completedAt[id];
    state.activity[date] = Math.max(0, (Number(state.activity[date]) || 0) - 1);
    if (!state.activity[date]) delete state.activity[date];
    delete state.completedAt[id];
  }
  saveState(state);
  renderTracks(state);
  updateSummary(state);
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
  let visible = 0;
  document.querySelectorAll(".task-row").forEach(row => {
    const isDone = row.classList.contains("done");
    const filterOk =
      activeFilter === "all" ||
      (activeFilter === "done" && isDone) ||
      (activeFilter === "open" && !isDone);
    const match = row.textContent.toLowerCase().includes(term);
    const show = filterOk && match;
    row.classList.toggle("hidden", !show);
    if (show) visible++;
  });
  document.getElementById("emptyState").classList.toggle("show", visible === 0);
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
      }, 1000);
  });
  document.getElementById("timerPause").addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
  });
  document.getElementById("timerReset").addEventListener("click", () => {
    focusSeconds = 0;
    setTimer();
  });
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
  setAuthMode(false);
  setTimer();
  currentState = loadLocalState();
  renderTracks(currentState);
  updateSummary(currentState);
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
};
