import React, { useEffect, useRef, useState } from "react";
import { defaultLearnerFields, type RoadmapPackage, type LearnerMutation, type LearnerRecord } from "../../packages/roadmap-schema/src/index";
import { addDays, assignedDate, isCompleted, recordKey, requiredProgress, scheduleWarnings, todayKey, topicGraph, type Records } from "./study-model";
import { indexedStore, optimisticRecords, StudySync, type Snapshot, type Transport } from "./sync";
import { downloadRecovery } from "./study-storage";

const views = ["overview", "roadmap", "schedule", "resources", "progress", "settings"] as const;
type View = typeof views[number];
type Task = RoadmapPackage["content"]["tasks"][number];
type Resource = RoadmapPackage["content"]["resources"][number];
type Props = { accountId: string; roadmapId: string; choices: { id: string; title: string }[]; loadPackage(): Promise<RoadmapPackage>; transport: Transport; onChoose(id: string): void; onBack(): void; onSignOut(): Promise<void> };
const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
export function taskFromRoute(search: string, hash: string) {
  return new URLSearchParams(hash.startsWith("#/study/") ? hash.split("?")[1] ?? "" : search).get("task") ?? "";
}
function useTextDraft(record: LearnerRecord, field: "text" | "evidence") {
  const baseline = useRef(record);
  const [text, setText] = useState(String(record.data[field] ?? ""));
  useEffect(() => {
    if (text === String(baseline.current.data[field] ?? "")) {
      baseline.current = record; setText(String(record.data[field] ?? ""));
    }
  }, [record, field, text]);
  return { text, setText, baseline };
}

function routeFromLocation() {
  const path = location.hash.match(/^#\/study\/[^/]+\/(\w+)/)?.[1] ?? new URLSearchParams(location.search).get("view");
  return views.includes(path as View) ? path as View : "overview";
}
function safeUrl(value?: string) { try { const url = new URL(value ?? ""); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
export function ResourceLink({ resource }: { resource: Resource }) {
  const url = safeUrl(resource.url);
  return <article className="study-resource"><h4>{resource.title}</h4><p>{resource.sourceType} · {resource.role} · {resource.accessStatus}</p>
    {resource.locator && <p>{Object.entries(resource.locator).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>}
    {resource.reference && <p className="study-text">{resource.reference}</p>}
    <p>{resource.provenance.accessed ? "Source accessed" : "Source not accessed"} · {resource.provenance.method} · confidence {Math.round(resource.provenance.confidence * 100)}%</p>
    {resource.provenance.limitations.map((item, i) => <p key={i}>{item}</p>)}
    {url ? <a className="button secondary" href={url} target="_blank" rel="noopener noreferrer">Open resource ↗</a> : <span>Reference only · open through your own authorized access</span>}
  </article>;
}

export function TaskDetail({ task, value, records, sync, close }: { task: Task; value: RoadmapPackage; records: Records; sync: StudySync; close(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const draft = useTextDraft(records[recordKey("note", task.taskId)] ?? {revision:0,data:defaultLearnerFields("note")}, "text");
  const note = draft.text; const setNote = draft.setText;
  const [minutes, setMinutes] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { const node = dialog.current!; if (!node.open) node.showModal(); }, []);
  const done = isCompleted(records, task.taskId);
  const completion = records[recordKey("completion", task.taskId)]?.data.completedAt;
  const logged = Object.entries(records).filter(([key, row]) => key.startsWith("study-time:") && row.data.taskId === task.taskId).reduce((sum, [, row]) => sum + Number(row.data.minutes), 0);
  const save = async (kind: LearnerMutation["payload"]["kind"], changes: LearnerMutation["payload"]["changes"]) => {
    try { await sync.enqueue(kind, kind === "study-time" ? crypto.randomUUID() : task.taskId, changes, kind === "note" ? draft.baseline.current : undefined); if (kind === "note") draft.baseline.current = optimisticRecords(sync.snapshot)[recordKey("note", task.taskId)]; setNotice(sync.error || "Saved locally; sync status is shown in the workspace."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Save failed"); }
  };
  return <dialog ref={dialog} className="task-dialog" aria-labelledby="task-detail-title" onClose={close}>
    <div className="study-heading"><div><p className="eyebrow">{task.type} · {task.required ? "Required" : "Optional"} · {task.minutes} min</p><h2 id="task-detail-title">{task.title}</h2></div><button className="quiet" aria-label="Close task detail" onClick={close}>Close</button></div>
    <h3>Objective</h3><p className="study-text">{task.objective}</p><h3>Instructions</h3><p className="study-text">{task.instructions}</p>
    <h3>Completion criteria</h3><ul>{task.criteria.map((criterion, i) => <li key={i}>{criterion}</li>)}</ul>
    <button onClick={() => void save("completion", { state: done ? "incomplete" : "completed", completedAt: done ? null : new Date().toISOString() })}>{done ? "Reopen task" : "Mark completed"}</button>
    {completion && <p>Completed {new Date(String(completion)).toLocaleString()}</p>}
    <form onSubmit={event => { event.preventDefault(); void save("note", { text: note }); }}><label>Private plain-text note<textarea maxLength={10000} value={note} onChange={event => setNote(event.target.value)} /></label><button className="secondary">Save note</button></form>
    <form onSubmit={event => { event.preventDefault(); void save("study-time", { taskId: task.taskId, minutes: Number(minutes), recordedAt: new Date().toISOString() }); setMinutes(""); }}><label>Manual study time (minutes)<input type="number" min="1" max="1440" required value={minutes} onChange={event => setMinutes(event.target.value)} /></label><button className="secondary">Log time</button><p>{logged} minutes recorded</p></form>
    {notice && <p role="status">{notice}</p>}
    <h3>Resources</h3>{value.content.resources.filter(r => task.resourceIds.includes(r.resourceId)).map(resource => <ResourceLink key={resource.resourceId} resource={resource} />)}
  </dialog>;
}

export function DependencyGraph({ topics }: { topics: RoadmapPackage["content"]["topics"] }) {
  const nodes = topicGraph(topics);
  const width = Math.max(200, ...nodes.map(node => node.x + 200));
  const height = Math.max(100, ...nodes.map(node => node.y + 100));
  return <div className="dependency-graph" role="region" aria-label="Dependency graph; the topic list below contains the same information" tabIndex={0}>
    <div className="graph-canvas" style={{ width, height }}><svg width={width} height={height} aria-hidden="true"><defs><marker id="dependency-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8d7020" /></marker></defs>{nodes.flatMap(node => node.topic.prerequisiteTopicIds.map(id => { const from = nodes.find(n => n.topic.topicId === id)!; return <line key={`${id}:${node.topic.topicId}`} x1={from.x + 200} y1={from.y + 50} x2={node.x} y2={node.y + 50} stroke="#8d7020" strokeWidth="2" markerEnd="url(#dependency-arrow)" />; }))}</svg>
    {nodes.map(node => <button className="graph-node secondary" key={node.topic.topicId} style={{ left:node.x,top:node.y }} onClick={() => { const detail = document.getElementById(`topic-${node.topic.topicId}`) as HTMLDetailsElement | null; if (detail) { detail.open = true; detail.scrollIntoView({ block:"nearest" }); detail.querySelector("summary")?.focus(); } }}><strong>{node.topic.title}</strong><span>{node.topic.prerequisiteTopicIds.length ? `${node.topic.prerequisiteTopicIds.length} prerequisite(s)` : "Starting topic"}</span></button>)}
    </div>
  </div>;
}

function EvidenceForm({ kind, id, name, criteria, records, sync }: { kind: "mastery" | "milestone"; id: string; name: string; criteria: string[]; records: Records; sync: StudySync }) {
  const fields = records[recordKey(kind, id)]?.data;
  const draft = useTextDraft(records[recordKey(kind, id)] ?? {revision:0,data:defaultLearnerFields(kind)}, "evidence");
  const [notice, setNotice] = useState("");
  const save = async () => {
    try { await sync.enqueue(kind, id, {evidence:draft.text}, draft.baseline.current); draft.baseline.current = optimisticRecords(sync.snapshot)[recordKey(kind,id)]; setNotice(sync.error || "Evidence saved locally."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Save failed"); }
  };
  const states = kind === "mastery" ? ["not-assessed", "developing", "demonstrated"] : ["not-assessed", "in-progress", "demonstrated"];
  return <article className="study-panel"><h3>{name}</h3><ul>{criteria.map((criterion, index) => <li key={index}>{criterion}</li>)}</ul>
    <label>{kind === "mastery" ? "Topic mastery" : "Milestone status"}<select value={String(fields?.state ?? "not-assessed")} onChange={event => void sync.enqueue(kind, id, { state: event.target.value } as LearnerMutation["payload"]["changes"])}>{states.map(state => <option key={state} value={state}>{title(state)}</option>)}</select></label>
    <form onSubmit={event => { event.preventDefault(); void save(); }}><label>Evidence<textarea maxLength={10000} value={draft.text} onChange={event => draft.setText(event.target.value)} /></label><button className="secondary">Save evidence</button></form>{notice && <p role="status">{notice}</p>}
  </article>;
}

function ConflictCard({ pending, sync }: { pending: Snapshot["outbox"][number]; sync: StudySync }) {
  const [combined, setCombined] = useState(String(pending.mutation.payload.kind === "note" ? pending.mutation.payload.changes.text : ""));
  return <article className="study-conflict"><h3>Choose a version · {pending.mutation.payload.kind}</h3><p>Both versions are preserved until you choose. No device clock decides the winner.</p>
    <div className="study-columns"><div><h4>Your pending version</h4><pre>{JSON.stringify(pending.mutation.payload.changes, null, 2)}</pre></div><div><h4>Server version</h4><pre>{JSON.stringify(pending.remote?.data, null, 2)}</pre></div></div>
    {pending.mutation.payload.kind === "note" && <label>Keep or combine the note<textarea maxLength={10000} value={combined} onChange={event => setCombined(event.target.value)} /></label>}
    <div className="button-row"><button onClick={() => void sync.resolve(pending.mutation.mutationId, true, pending.mutation.payload.kind === "note" ? combined : undefined)}>Keep my version</button><button className="secondary" onClick={() => void sync.resolve(pending.mutation.mutationId, false)}>Use server version</button></div>
  </article>;
}

function MoveAssignment({ value, schedule, assignment, records, sync }: { value: RoadmapPackage; schedule: RoadmapPackage["schedules"][number]; assignment: RoadmapPackage["schedules"][number]["assignments"][number]; records: Records; sync: StudySync }) {
  const currentDate = assignedDate(schedule, assignment, records);
  const [date, setDate] = useState(currentDate);
  const [reason, setReason] = useState("");
  const proposed = { ...records, [recordKey("assignment", assignment.assignmentId)]: { revision: 0, data: { date, scheduleId: schedule.scheduleId } } };
  const warnings = date && date !== currentDate ? scheduleWarnings(value, schedule, proposed).warnings : [];
  return <details className="move-task"><summary>Move to date</summary><form onSubmit={event => { event.preventDefault(); void sync.enqueue("assignment", assignment.assignmentId, { scheduleId: schedule.scheduleId, date, overrideReason: reason }); }}>
    <label>New date<input type="date" required value={date} onInput={event => setDate(event.currentTarget.value)} /></label>
    {warnings.length > 0 && <div className="study-warning" role="status">{warnings.map(w => <p key={w}>{w}</p>)}<p>A move keeps task identity and does not replan other dates.</p></div>}
    <label>{warnings.length ? "Reason for the override (required)" : "Move reason (optional)"}<input maxLength={10000} required={warnings.length > 0} value={reason} onChange={event => setReason(event.target.value)} /></label><button className="secondary" disabled={!date || date === currentDate || (warnings.length > 0 && !reason.trim())}>Confirm date move</button>
  </form></details>;
}

export function StudyWorkspace(props: Props) {
  const refreshStudy = useRef<() => void>(() => {});
  const [, redraw] = useState(0);
  const [engine, setEngine] = useState<StudySync>();
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>(routeFromLocation);
  const [taskId, setTaskId] = useState(taskFromRoute(location.search, location.hash));
  const [sidebar, setSidebar] = useState(true);
  const [graph, setGraph] = useState(false);
  const [resourceFilter, setResourceFilter] = useState("all");
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const [date, setDate] = useState("");
  const [weekly, setWeekly] = useState(true);
  const [timezone, setTimezone] = useState(localStorage.getItem(`semassist-study-timezone:${props.accountId}`) ?? "");
  const [timezoneDraft, setTimezoneDraft] = useState(timezone);
  const [theme, setTheme] = useState(localStorage.getItem(`semassist-study-theme:${props.accountId}`) ?? "light");

  useEffect(() => {
    let cancelled = false; let sync: StudySync | undefined; let unlock: (() => void) | undefined;
    const lockAbort = new AbortController();
    const store = indexedStore();
    async function load() {
      let cached: Snapshot | undefined;
      try { cached = await store.read(props.accountId, props.roadmapId); }
      catch (error) { throw new Error(`Cache unavailable: ${error instanceof Error ? error.message : "unknown error"}. Reopen after resolving the storage error; unread queued work will not be overwritten.`); }
      let value: RoadmapPackage;
      try { value = await props.loadPackage(); }
      catch (error) { if (!cached) throw error; value = cached.package; setLoadError("Using the previously opened plan. Retry when online to refresh definitions."); }
      if (cancelled) return;
      const snapshot = cached ?? { accountId: props.accountId, roadmapId: props.roadmapId, package: value, records: {}, outbox: [] };
      snapshot.package = value;
      sync = new StudySync(snapshot, store, props.transport, () => { if (!cancelled) redraw(v => v + 1); });
      setEngine(sync);
      try { await store.write(snapshot); } catch (error) { sync.error = `Cache failed: ${error instanceof Error ? error.message : "unknown error"}. Export a recovery copy.`; redraw(v => v + 1); }
      window.semassistStudy = { pending: () => sync!.snapshot.outbox.length > 0 || sync!.saving || !!sync!.error, export: () => downloadRecovery(sync!.snapshot), stop: () => sync!.stop() };
      void sync.flush();
    }
    // One writer per account/plan on this browser prevents tabs replacing each other's outbox.
    const open = async () => {
      if (navigator.locks) {
        setLoadError("Opening study plan. If it is open in another tab, close that study view to release the local queue.");
        await navigator.locks.request(`semassist-study:${props.accountId}:${props.accountId === "demo" ? "account" : props.roadmapId}`, { signal:lockAbort.signal }, async () => {
        if (cancelled) return;
        setLoadError("");
        await load(); await new Promise<void>(resolve => { unlock = resolve; if (cancelled) resolve(); });
        });
      }
      else { setLoadError("This browser cannot lock the local queue safely. Use a browser with Web Locks support to edit this roadmap."); }
    };
    void open().catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not open roadmap"); });
    let refreshing = false;
    const retry = () => {
      if (!sync || refreshing || cancelled) return;
      refreshing = true;
      void (async () => {
        try {
          if (navigator.onLine) {
            const value = await props.loadPackage();
            if (cancelled) return;
            await sync!.updatePackage(value); setLoadError("");
          }
        } catch { if (!cancelled) setLoadError("Using cached definitions. Reconnect and retry to refresh the plan."); }
        finally { await sync?.flush(); refreshing = false; }
      })();
    };
    refreshStudy.current = retry;
    const leave = (event: BeforeUnloadEvent) => { if (sync?.snapshot.outbox.length || sync?.saving || sync?.error) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("online", retry); window.addEventListener("offline", retry); window.addEventListener("focus", retry); window.addEventListener("pageshow", retry); window.addEventListener("beforeunload", leave);
    const visibility = () => { if (document.visibilityState === "visible") retry(); }; document.addEventListener("visibilitychange", visibility);
    return () => { cancelled = true; lockAbort.abort(); sync?.stop(); unlock?.(); delete window.semassistStudy; window.removeEventListener("online", retry); window.removeEventListener("offline", retry); window.removeEventListener("focus", retry); window.removeEventListener("pageshow", retry); window.removeEventListener("beforeunload", leave); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    const changed = () => { setView(routeFromLocation()); setTaskId(taskFromRoute(location.search, location.hash)); };
    window.addEventListener("hashchange", changed); return () => window.removeEventListener("hashchange", changed);
  }, []);
  function navigate(next: View, task = "") {
    setView(next); setTaskId(task);
    history.pushState(null, "", `#/study/${props.roadmapId}/${next}${task ? `?task=${task}` : ""}`);
    parent.postMessage({ type: "semassist-roadmaps-route", roadmap: props.roadmapId, view: next, task }, location.origin);
  }
  if (!engine) return <section className="study-panel"><p role="status">{loadError || "Opening your study plan…"}</p><button className="secondary" onClick={props.onBack}>Back to My Roadmaps</button></section>;
  const value = engine.snapshot.package;
  const records = optimisticRecords(engine.snapshot);
  const schedule = value.schedules[scheduleIndex] ?? value.schedules[0];
  let zone = timezone || schedule.timezone;
  try { new Intl.DateTimeFormat("en", { timeZone: zone }); } catch { zone = schedule.timezone; }
  const today = todayKey(zone);
  const selectedDate = date || today;
  const progress = requiredProgress(value, records);
  const nextTask = value.content.tasks.find(t => t.required && !isCompleted(records, t.taskId)) ?? value.content.tasks.find(t => !isCompleted(records, t.taskId));
  const todays = schedule.assignments.filter(a => assignedDate(schedule, a, records) === today).map(a => value.content.tasks.find(t => t.taskId === a.taskId)!).filter(Boolean);
  const milestone = [...schedule.milestonePlacements].filter(p => p.date >= today && records[recordKey("milestone", p.milestoneId)]?.data.state !== "demonstrated").sort((a,b) => a.date.localeCompare(b.date))[0];
  const task = value.content.tasks.find(t => t.taskId === taskId);
  const { warnings, workload } = scheduleWarnings(value, schedule, records);
  const showTask = (item: Task) => navigate(view, item.taskId);
  const taskList = (items: Task[]) => <ul className="study-task-list">{items.map(t => <li key={t.taskId}><button className="study-task quiet" onClick={() => showTask(t)}><span>{isCompleted(records, t.taskId) ? "✓ Completed" : "○ Open"}</span><strong>{t.title}</strong><span>{t.type} · {t.minutes} min · {t.required ? "Required" : "Optional"}</span></button></li>)}</ul>;
  const days = Array.from({ length: weekly ? 7 : 1 }, (_, i) => addDays(selectedDate, i));
  return <section className={`study-workspace ${theme === "dark" ? "study-dark" : ""}`}>
    <header className="study-heading"><div><button className="quiet" onClick={props.onBack}>← My Roadmaps</button><h2>{value.roadmap.title}</h2><p>{value.roadmap.subject} · {value.roadmap.level}</p></div><div className="study-sync" role="status"><strong>{props.accountId === "demo" ? "Local demo · " : ""}{title(engine.status())}{engine.snapshot.outbox.length ? ` · ${engine.snapshot.outbox.length} queued` : ""}</strong><button className="secondary" onClick={() => refreshStudy.current()}>Retry / refresh</button></div></header>
    {loadError && <p className="study-warning" role="status">{loadError}</p>}{engine.error && <p className="study-warning" role="alert">{engine.error}</p>}
    {engine.snapshot.outbox.filter(p => p.status === "error").map(p => <p className="study-warning" role="alert" key={p.mutation.mutationId}>{p.error} · your edit remains queued.</p>)}
    {engine.snapshot.outbox.filter(p => p.status === "conflict").map(p => <ConflictCard key={p.mutation.mutationId} pending={p} sync={engine} />)}
    <label className="study-switcher">Roadmap<select value={props.roadmapId} onChange={event => props.onChoose(event.target.value)}>{props.choices.map(choice => <option key={choice.id} value={choice.id}>{choice.title}</option>)}</select></label>
    <button className="quiet sidebar-toggle" aria-expanded={sidebar} onClick={() => setSidebar(v => !v)}>Toggle navigation</button>
    <div className={`study-layout ${sidebar ? "" : "sidebar-collapsed"}`}><nav className="study-nav" aria-label="Study views">{views.map(item => <button key={item} className={view === item ? "selected" : "quiet"} aria-current={view === item ? "page" : undefined} onClick={() => navigate(item)}>{title(item)}</button>)}</nav>
      <nav className="study-mobile-nav" aria-label="Phone study views">{views.slice(0,3).map(item => <button key={item} className={view === item ? "selected" : "quiet"} onClick={() => navigate(item)}>{title(item)}</button>)}<label>More<select aria-label="More study views" value={views.slice(3).includes(view) ? view : ""} onChange={event => navigate(event.target.value as View)}><option value="" disabled>Choose</option>{views.slice(3).map(item => <option key={item} value={item}>{title(item)}</option>)}</select></label></nav>
      <div className="study-content"><p className="study-breadcrumb">{value.roadmap.title} / {title(view)}</p>
        {view === "overview" && <><h3>Study overview</h3><div className="study-columns"><article className="study-panel"><p>Required completion</p><strong className="study-number">{progress.percent === null ? "No required tasks" : `${progress.percent}%`}</strong><p>{progress.completed} of {progress.total} required tasks</p><progress max={progress.total || 1} value={progress.completed} aria-label="Required task completion" /></article><article className="study-panel"><h3>Continue learning</h3>{nextTask ? <><p>{nextTask.title}</p><button onClick={() => showTask(nextTask)}>Open next task</button></> : <p>All tasks completed.</p>}</article></div><h3>Today · {today}</h3>{todays.length ? taskList(todays) : <p>No tasks scheduled today. Use the schedule to choose another day or catch up.</p>}<h3>Upcoming milestone</h3>{milestone ? <p>{value.content.milestones.find(m => m.milestoneId === milestone.milestoneId)?.title} · {milestone.date}</p> : <p>No upcoming milestone.</p>}<h3>Goals</h3><ul>{value.roadmap.goals.map((goal,i) => <li key={i}>{goal}</li>)}</ul></>}
        {view === "roadmap" && <><div className="study-heading"><h3>Topics and dependencies</h3><button className="secondary" aria-pressed={graph} onClick={() => setGraph(v => !v)}>{graph ? "Show list" : "Show dependency graph"}</button></div>{graph && <DependencyGraph topics={value.content.topics} />}{value.content.topics.map(topic => <details className="study-panel" id={`topic-${topic.topicId}`} key={topic.topicId}><summary>{topic.title} · {topic.difficulty} · {topic.classification}</summary><ul>{topic.objectives.map((objective,i) => <li key={i}>{objective}</li>)}</ul><p>Prerequisites: {topic.prerequisiteTopicIds.map(id => value.content.topics.find(t => t.topicId === id)?.title).join(", ") || "None"}</p>{taskList(value.content.tasks.filter(t => t.topicId === topic.topicId))}{value.content.resources.filter(r => topic.resourceIds.includes(r.resourceId)).map(r => <ResourceLink key={r.resourceId} resource={r} />)}</details>)}</>}
        {view === "schedule" && <><h3>Schedule</h3><div className="study-controls"><label>Schedule view<select value={scheduleIndex} onChange={event => setScheduleIndex(Number(event.target.value))}>{value.schedules.map((s,i) => <option key={s.scheduleId} value={i}>{s.name}</option>)}</select></label><label>Start date<input type="date" value={selectedDate} onInput={event => setDate(event.currentTarget.value)} /></label><button className="secondary" onClick={() => setDate(addDays(selectedDate, weekly ? -7 : -1))}>Previous</button><button className="secondary" onClick={() => setDate(addDays(selectedDate, weekly ? 7 : 1))}>Next</button><button className="secondary" aria-pressed={weekly} onClick={() => setWeekly(v => !v)}>{weekly ? "Show daily" : "Show weekly"}</button></div><p>{schedule.timezone} · {schedule.dailyCapacityMinutes} min daily capacity · switching this view does not activate a new schedule.</p>{warnings.length > 0 && <details className="study-warning"><summary>Schedule warnings ({warnings.length})</summary>{warnings.map(w => <p key={w}>{w}</p>)}</details>}<div className="schedule-grid">{days.map(day => <article className="study-day" key={day}><h4>{day}</h4><p>{workload.get(day) ?? 0} / {schedule.dailyCapacityMinutes} min</p>{schedule.assignments.filter(a => assignedDate(schedule,a,records) === day).map(a => { const item = value.content.tasks.find(t => t.taskId === a.taskId); return item && <div className="scheduled-task" key={a.assignmentId}>{taskList([item])}<MoveAssignment key={`${a.assignmentId}:${day}`} value={value} schedule={schedule} assignment={a} records={records} sync={engine} />{records[recordKey("assignment",a.assignmentId)]?.data.overrideReason && <p>Move reason: {String(records[recordKey("assignment",a.assignmentId)].data.overrideReason)}</p>}</div>; })}<p className="catch-up">Catch-up capacity: {Math.max(0,schedule.dailyCapacityMinutes-(workload.get(day) ?? 0))} min</p></article>)}</div></>}
        {view === "resources" && <><h3>Resources</h3><label>Source access<select value={resourceFilter} onChange={event => setResourceFilter(event.target.value)}><option value="all">All sources</option>{[...new Set(value.content.resources.map(r => r.accessStatus))].map(status => <option key={status}>{status}</option>)}</select></label>{value.content.resources.filter(r => resourceFilter === "all" || r.accessStatus === resourceFilter).map(r => <ResourceLink key={r.resourceId} resource={r} />)}</>}
        {view === "progress" && <><h3>Progress</h3><p>{progress.completed} / {progress.total} required tasks completed{progress.percent === null ? " · No required tasks in this revision" : ` · ${progress.percent}%`}. Optional tasks and inactive revisions are excluded.</p>{taskList(value.content.tasks)}<h3>Topic mastery</h3><p>Mastery is assessed separately from task completion.</p>{value.content.topics.map(t => <EvidenceForm key={t.topicId} kind="mastery" id={t.topicId} name={t.title} criteria={t.objectives} records={records} sync={engine} />)}<h3>Milestones</h3>{value.content.milestones.map(m => <EvidenceForm key={m.milestoneId} kind="milestone" id={m.milestoneId} name={m.title} criteria={m.criteria} records={records} sync={engine} />)}</>}
        {view === "settings" && <><h3>Settings</h3><p>Account: {props.accountId === "demo" ? "Local demo" : "Signed in"}</p><p>Sync: {engine.status()} · cached data is a convenience, not a backup. First login, uncached plans, imports and schedule activation need an online connection.</p><label>Study timezone<input value={timezoneDraft || schedule.timezone} onChange={event => setTimezoneDraft(event.target.value)} onBlur={() => { try { const next = timezoneDraft || schedule.timezone; new Intl.DateTimeFormat("en",{timeZone:next}); setTimezone(next); localStorage.setItem(`semassist-study-timezone:${props.accountId}`,next); setLoadError(""); } catch { setTimezoneDraft(schedule.timezone); setLoadError("Enter a valid IANA timezone, such as Asia/Colombo."); } }} /></label><label>Theme<select value={theme} onChange={event => { setTheme(event.target.value); localStorage.setItem(`semassist-study-theme:${props.accountId}`,event.target.value); }}><option value="light">Paper / charcoal</option><option value="dark">Dark</option></select></label><div className="button-row"><button onClick={() => downloadRecovery(engine.snapshot)}>Export study recovery copy</button><button className="secondary" onClick={() => void props.onSignOut()}>Sign out safely</button></div><p>The recovery copy preserves this plan, learner records and queued edits. Full-account backup restore is planned in phase 7.</p><button className="secondary" onClick={async () => { if (!confirm("Clear cached study data for this account? A recovery copy is offered for pending edits.")) return; if (await window.semassistPrepareSignOut?.()) props.onBack(); }}>Clear this account's cache</button></>}
      </div></div>
    {task && <TaskDetail key={task.taskId} task={task} value={value} records={records} sync={engine} close={() => navigate(view)} />}
  </section>;
}
