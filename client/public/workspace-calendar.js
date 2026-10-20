const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromKey = value => new Date(`${value}T12:00:00`);
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
export function validCalendarDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && key(fromKey(value)) === value;
}
export function calendarWeek(value) {
  const date = fromKey(value);
  const monday = addDays(date, -((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => key(addDays(monday, index)));
}
export function normalizeCalendarEvents(events) {
  const ids = new Set();
  return (Array.isArray(events) ? events : []).filter(event => {
    if (!event || typeof event.id !== "string" || !/^session-[a-z0-9-]{1,80}$/.test(event.id) || ids.has(event.id) || typeof event.title !== "string" || !event.title.trim() || !validCalendarDate(event.date)) return false;
    ids.add(event.id); return true;
  }).slice(0, 500).map(event => ({ id: event.id, title: event.title.trim().slice(0, 140), date: event.date, ...(event.completed === true ? { completed: true } : {}), ...(Number.isInteger(event.start) && Number.isInteger(event.duration) ? { start: event.start, duration: event.duration } : {}), notes: typeof event.notes === "string" ? event.notes.slice(0, 500) : "", trackId: typeof event.trackId === "string" && /^[a-z0-9:-]{1,100}$/.test(event.trackId) ? event.trackId : "" }));
}
export function calendarMonth(value) {
  const date = fromKey(value), first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const monday = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => key(addDays(monday, index)));
}
export function normalizeCalendarTaskDates(dates) {
  return Object.fromEntries(Object.entries(dates && typeof dates === "object" && !Array.isArray(dates) ? dates : {}).filter(([id, date]) => /^[a-z0-9:-]{1,240}$/.test(id) && (date === null || validCalendarDate(date))).slice(0, 2000));
}
const dateLabel = date => fromKey(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
export function calendarEntryForDay(entry, today) {
  const carriedFrom = !entry.completed && validCalendarDate(entry.date) && entry.date < today ? entry.date : null;
  return { ...entry, date: carriedFrom ? today : entry.date, carriedFrom };
}

export function initWorkspaceCalendar(api) {
  const doc = document;
  const byId = id => doc.getElementById(id);
  const escape = api.escapeHtml;
  let selected = api.todayKey(), filter = "all", editing = "", view = "week";
  let dragged = null, planning = "";
  let lastToday = api.todayKey();
  const dialog = byId("calendarDialog");
  const planDialog = byId("calendarPlanDialog");
  const allTracks = () => [...api.tracks(), ...api.roadmaps()];
  const close = () => { if (dialog.open && dialog.close) dialog.close(); else dialog.removeAttribute("open"); editing = ""; };
  function options(select, chosen, general = "General study") {
    select.innerHTML = `<option value="">${general}</option>` + allTracks().map(track => `<option value="${escape(track.id)}">${escape(track.name)}</option>`).join("");
    if (chosen && !allTracks().some(track => track.id === chosen)) select.insertAdjacentHTML("beforeend", `<option value="${escape(chosen)}">Previous track</option>`);
    select.value = chosen;
  }
  function open(date = selected, event = null) {
    editing = event?.id || "";
    byId("calendarForm").reset();
    byId("calendarDialogTitle").textContent = editing ? "Edit study session" : "New study session";
    byId("calendarEventTitle").value = event?.title || "";
    byId("calendarEventDate").value = event ? calendarEntryForDay(event, api.todayKey()).date : date;
    byId("calendarEventCompleted").checked = Boolean(event?.completed);
    byId("calendarEventNotes").value = event?.notes || "";
    options(byId("calendarEventTrack"), event?.trackId || "");
    byId("calendarDelete").hidden = !editing;
    byId("calendarFormMessage").textContent = "";
    if (!dialog.open) { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", ""); }
    byId("calendarEventTitle").focus();
  }
  function tasks(state) {
    return [
      ...state.customTasks.map(task => ({ id: task.id, title: task.title, date: validCalendarDate(task.dueDate) ? task.dueDate : null, completed: task.completed, trackId: "personal", source: "Personal task" })),
      ...api.roadmaps().flatMap(track => track.tasks.map(task => ({ id: task.id, title: task.label, date: task.date, completed: task.completed, trackId: track.id, source: track.name, roadmap: track.roadmapId, task: task.sourceTaskId }))),
      ...api.tracks().flatMap(track => track.tasks.map((task, index) => ({ id: api.taskId(track, index), title: task[0], date: null, completed: Boolean(state.completed[api.taskId(track, index)]), trackId: track.id, source: track.name }))),
    ].map(task => calendarEntryForDay({ ...task, originalDate: task.date, date: task.trackId !== "personal" && Object.hasOwn(state.calendarTaskDates, task.id) ? state.calendarTaskDates[task.id] : task.date }, api.todayKey())).filter(task => filter === "all" || task.trackId === filter);
  }
  function taskButton(task) {
    return `<div class="calendar-task-wrap"><button type="button" draggable="true" class="calendar-task${task.completed ? " is-complete" : ""}${task.carriedFrom ? " calendar-carried" : ""}" data-calendar-task="${escape(task.id)}" title="${escape(task.title)}"><strong>${escape(task.title)}</strong><small>${escape(task.source)}${task.date ? ` · ${dateLabel(task.date)}` : " · no date"}${task.completed ? " · completed" : ""}</small>${carriedNote(task)}</button><button type="button" class="calendar-plan-button" data-calendar-plan="${escape(task.id)}" aria-label="Plan date for ${escape(task.title)}" title="Plan date">↔</button></div>`;
  }
  function carriedNote(entry) {
    return entry.carriedFrom ? `<small class="calendar-carried-note">Carried forward · assigned ${escape(entry.carriedFrom)}</small>` : "";
  }
  function sessionButton(event) {
    const track = allTracks().find(item => item.id === event.trackId);
    return `<button type="button" draggable="true" class="calendar-session${event.carriedFrom ? " calendar-carried" : ""}${event.completed ? " is-complete" : ""}" data-calendar-event="${event.id}"><strong>${escape(event.title)}</strong><span>${escape(track?.name || "Study session")} · All day${event.completed ? " · completed" : ""}</span>${carriedNote(event)}${event.notes ? `<small>${escape(event.notes)}</small>` : ""}</button>`;
  }
  function render() {
    if (doc.body.dataset.workspacePage !== "calendar") return;
    if (lastToday !== api.todayKey()) { if (selected === lastToday) selected = api.todayKey(); lastToday = api.todayKey(); }
    const state = api.loadState(), days = view === "month" ? calendarMonth(selected) : calendarWeek(selected), today = api.todayKey();
    const inPeriod = date => view === "month" ? typeof date === "string" && date.slice(0, 7) === selected.slice(0, 7) : days.includes(date);
    if (!["all", "personal", ...allTracks().map(track => track.id)].includes(filter)) filter = "all";
    const entries = tasks(state);
    const sessions = state.calendarEvents.map(event => calendarEntryForDay(event, today)).filter(event => filter === "all" || (filter === "personal" ? !event.trackId : event.trackId === filter));
    byId("calendarRange").textContent = view === "month" ? fromKey(selected).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : `${dateLabel(days[0])} — ${dateLabel(days[6])}, ${fromKey(days[6]).getFullYear()}`;
    byId("calendarViewWeek").setAttribute("aria-pressed", String(view === "week"));
    byId("calendarViewMonth").setAttribute("aria-pressed", String(view === "month"));
    byId("calendarPrevious").setAttribute("aria-label", `Previous ${view}`);
    byId("calendarNext").setAttribute("aria-label", `Next ${view}`);
    byId("calendarScroller").setAttribute("aria-label", `${view === "month" ? "Monthly" : "Weekly"} all-day schedule. Scroll horizontally for all seven days.`);
    byId("calendarRailPeriod").textContent = view === "month" ? "This month" : "This week";
    byId("calendarTimezone").textContent = window.Intl.DateTimeFormat().resolvedOptions().timeZone;
    options(byId("calendarFilter"), "", "All tracks");
    byId("calendarFilter").insertAdjacentHTML("beforeend", '<option value="personal">Personal / general</option>');
    byId("calendarFilter").value = filter === "all" ? "" : filter;
    const weekTasks = entries.filter(task => inPeriod(task.date));
    byId("calendarWeekTasks").innerHTML = weekTasks.map(taskButton).join("") || '<p class="calendar-empty">No checkpoints due in this view.</p>';
    const undated = entries.filter(task => !task.date && !task.completed);
    byId("calendarUndatedTasks").innerHTML = undated.slice(0, 15).map(taskButton).join("") || '<p class="calendar-empty">Every task has a date.</p>';
    byId("calendarUndatedCount").textContent = undated.length ? `${undated.length} tasks${undated.length > 15 ? " · showing first 15" : ""}` : "";
    byId("calendarWeekCount").textContent = `${sessions.filter(event => inPeriod(event.date)).length} study sessions · ${weekTasks.length} checkpoints`;
    const month = fromKey(selected), first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const monthStart = addDays(first, -((first.getDay() + 6) % 7));
    byId("calendarMiniTitle").textContent = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    byId("calendarMiniGrid").innerHTML = ["M", "T", "W", "T", "F", "S", "S"].map(day => `<span aria-hidden="true">${day}</span>`).join("") + Array.from({ length: 42 }, (_, index) => {
      const date = addDays(monthStart, index), value = key(date);
      return `<button type="button" data-calendar-date="${value}" class="${inPeriod(value) ? "in-week " : ""}${date.getMonth() !== month.getMonth() ? "other-month " : ""}${value === today ? "is-today" : ""}" aria-label="Show date ${escape(date.toLocaleDateString(undefined, { dateStyle: "full" }))}" ${value === today ? 'aria-current="date"' : ""}>${date.getDate()}</button>`;
    }).join("");
    const dayItems = date => sessions.filter(event => event.date === date).map(sessionButton).join("") + entries.filter(task => task.date === date).map(taskButton).join("");
    const dayHead = date => `<div class="calendar-day-head${date === today ? " is-today" : ""}"><span>${fromKey(date).toLocaleDateString(undefined, { weekday: "short" })}</span><strong>${fromKey(date).getDate()}</strong><button type="button" data-calendar-add="${date}" aria-label="Add study session on ${date}">+</button></div>`;
    byId("calendarBoard").innerHTML = view === "month"
      ? `<div class="calendar-month-weekdays">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => `<span>${day}</span>`).join("")}</div><div class="calendar-month-grid">${days.map(date => `<section data-calendar-drop="${date}" class="calendar-month-cell${!inPeriod(date) ? " other-month" : ""}${date === today ? " is-today" : ""}" aria-label="${date}">${dayHead(date)}<div class="calendar-day-items">${dayItems(date)}</div></section>`).join("")}</div>`
      : `<div class="calendar-days">${days.map(date => `<div data-calendar-drop="${date}">${dayHead(date)}</div>`).join("")}</div><div class="calendar-all-day">${days.map(date => `<div data-calendar-drop="${date}" class="calendar-day-items" aria-label="All day ${date}">${dayItems(date) || '<p class="calendar-empty">Nothing scheduled</p>'}</div>`).join("")}</div>`;

  }
  function clearDrag() {
    dragged = null;
    byId("calendar").querySelectorAll(".is-dragging, .is-drop-target").forEach(element => element.classList.remove("is-dragging", "is-drop-target"));
  }
  function saveTaskDate(id, date, message) {
    const state = api.loadState(), task = tasks(state).find(item => item.id === id);
    if (!task || (date !== null && !validCalendarDate(date))) return false;
    if (task.trackId !== "personal" && !Object.hasOwn(state.calendarTaskDates, id) && Object.keys(state.calendarTaskDates).length >= 2000) { message.textContent = "You can plan up to 2,000 checkpoints."; return false; }
    return api.savePlan(task.trackId === "personal"
      ? { customTasks: state.customTasks.map(item => item.id === id ? { ...item, dueDate: date } : item) }
      : { calendarTaskDates: { ...state.calendarTaskDates, [id]: date } }, message);
  }
  function closePlan() {
    if (planDialog.open && planDialog.close) planDialog.close(); else planDialog.removeAttribute("open");
    planning = "";
  }
  function openPlan(id) {
    const task = tasks(api.loadState()).find(item => item.id === id);
    if (!task) return;
    planning = id;
    byId("calendarPlanTitle").textContent = task.title;
    byId("calendarPlanDate").value = task.date || selected;
    byId("calendarPlanNote").textContent = task.roadmap ? `Calendar planning date. Roadmap schedule: ${task.originalDate || "unscheduled"}.` : task.trackId === "personal" ? "Choose a due date for this personal task." : "Choose a calendar planning date for this checkpoint.";
    byId("calendarPlanMessage").textContent = "";
    if (planDialog.showModal) planDialog.showModal(); else planDialog.setAttribute("open", "");
    byId("calendarPlanDate").focus();
  }
  const calendar = byId("calendar");
  calendar.addEventListener("dragstart", event => {
    const source = event.target.closest("[data-calendar-event], [data-calendar-task]");
    if (!source || !event.dataTransfer) return;
    dragged = { id: source.dataset.calendarEvent || source.dataset.calendarTask, session: Boolean(source.dataset.calendarEvent) };
    event.dataTransfer.setData("text/plain", dragged.id);
    event.dataTransfer.effectAllowed = "move";
    source.classList.add("is-dragging");
  });
  calendar.addEventListener("dragend", clearDrag);
  calendar.addEventListener("dragover", event => {
    const target = event.target.closest("[data-calendar-drop]");
    if (!dragged || !target || (dragged.session && target.dataset.calendarDrop === "unscheduled")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    calendar.querySelectorAll(".is-drop-target").forEach(element => element.classList.remove("is-drop-target"));
    target.classList.add("is-drop-target");
  });
  calendar.addEventListener("dragleave", event => {
    const target = event.target.closest("[data-calendar-drop]");
    if (target && !target.contains(event.relatedTarget)) target.classList.remove("is-drop-target");
  });
  calendar.addEventListener("drop", event => {
    const date = event.target.closest("[data-calendar-drop]")?.dataset.calendarDrop, item = dragged;
    clearDrag();
    if (!item || (!validCalendarDate(date) && (date !== "unscheduled" || item.session))) return;
    event.preventDefault();
    const message = byId("calendarMoveStatus");
    const session = item.session && api.loadState().calendarEvents.find(entry => entry.id === item.id);
    const saved = item.session ? session && api.saveEvents(api.loadState().calendarEvents.map(entry => entry.id === item.id ? { ...entry, date } : entry), message) : saveTaskDate(item.id, date === "unscheduled" ? null : date, message);
    if (saved) { message.textContent = date === "unscheduled" ? "Moved to Unscheduled." : `Moved to ${dateLabel(date)}.`; render(); }
  });
  byId("calendarPlanForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!byId("calendarPlanForm").checkValidity()) return;
    const date = byId("calendarPlanDate").value;
    if (saveTaskDate(planning, date, byId("calendarPlanMessage"))) { selected = date; closePlan(); render(); byId("calendarMoveStatus").textContent = `Planned for ${dateLabel(date)}.`; byId("calendarNew").focus(); }
  });
  byId("calendarPlanClear").addEventListener("click", () => {
    if (saveTaskDate(planning, null, byId("calendarPlanMessage"))) { closePlan(); render(); byId("calendarMoveStatus").textContent = "Moved to Unscheduled."; byId("calendarNew").focus(); }
  });
  byId("calendarPlanCancel").addEventListener("click", closePlan);
  planDialog.addEventListener("cancel", () => { planning = ""; });
  function reveal(date) { if (validCalendarDate(date)) selected = date; render(); }
  function navigate(direction) {
    const date = fromKey(selected);
    reveal(view === "month" ? key(new Date(date.getFullYear(), date.getMonth() + direction, 1, 12)) : key(addDays(date, direction * 7)));
  }
  byId("calendarPrevious").addEventListener("click", () => navigate(-1));
  byId("calendarNext").addEventListener("click", () => navigate(1));
  byId("calendarViewWeek").addEventListener("click", () => { view = "week"; render(); });
  byId("calendarViewMonth").addEventListener("click", () => { view = "month"; render(); });
  byId("calendarToday").addEventListener("click", () => reveal(api.todayKey()));
  byId("calendarNew").addEventListener("click", () => open());
  byId("calendarFilter").addEventListener("change", event => { filter = event.target.value || "all"; render(); });
  byId("calendar").addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.dataset.calendarDate) reveal(button.dataset.calendarDate);
    if (button.dataset.calendarAdd) open(button.dataset.calendarAdd);
    if (button.dataset.calendarPlan) openPlan(button.dataset.calendarPlan);
    if (button.dataset.calendarEvent) { const session = api.loadState().calendarEvents.find(item => item.id === button.dataset.calendarEvent); if (session) open(session.date, session); }
    if (button.dataset.calendarTask) {
      const task = tasks(api.loadState()).find(item => item.id === button.dataset.calendarTask);
      if (task?.roadmap) api.openRoadmap(task.roadmap, "overview", task.task);
      else if (task) api.openSection(task.trackId === "personal" ? "custom" : task.trackId);
    }
  });
  byId("calendarForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!byId("calendarForm").checkValidity()) return;
    const previous = api.loadState().calendarEvents.find(item => item.id === editing);
    const value = { ...previous, id: editing || `session-${crypto.randomUUID()}`, title: byId("calendarEventTitle").value, date: byId("calendarEventDate").value, completed: byId("calendarEventCompleted").checked, notes: byId("calendarEventNotes").value, trackId: byId("calendarEventTrack").value };
    if (!normalizeCalendarEvents([value]).length) { byId("calendarFormMessage").textContent = "Enter a title and a valid date."; return; }
    const events = api.loadState().calendarEvents;
    if (!editing && events.length >= 500) { byId("calendarFormMessage").textContent = "You can save up to 500 study sessions."; return; }
    const next = normalizeCalendarEvents([...events.filter(item => item.id !== editing), value]);
    if (api.saveEvents(next, byId("calendarFormMessage"))) { selected = value.date; filter = "all"; close(); render(); byId("calendarNew").focus(); }
  });
  byId("calendarDelete").addEventListener("click", () => { if (editing && api.saveEvents(api.loadState().calendarEvents.filter(item => item.id !== editing), byId("calendarFormMessage"))) { close(); render(); byId("calendarNew").focus(); } });
  byId("calendarCancel").addEventListener("click", close);
  dialog.addEventListener("cancel", () => { editing = ""; });
  function nextDayRefresh() {
    const now = new Date(), midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    window.setTimeout(() => { render(); nextDayRefresh(); }, midnight.getTime() - now.getTime() + 100);
  }
  nextDayRefresh();
  window.addEventListener("focus", render);
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden) render(); });
  render();
  return { render, close: () => { close(); closePlan(); clearDrag(); }, reveal: date => { filter = "all"; reveal(date); }, reset: () => { close(); closePlan(); clearDrag(); byId("calendarMoveStatus").textContent = ""; byId("calendarForm").reset(); selected = api.todayKey(); filter = "all"; view = "week"; } };
}
