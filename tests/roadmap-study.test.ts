import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import fixture from "../examples/beginner-python.json";
import { learnerMutationSchema, mergeLearnerMutation, defaultLearnerFields, type RoadmapPackage, type LearnerMutation } from "../packages/roadmap-schema/src/index";
import { addDays, assignedDate, requiredProgress, scheduleWarnings, recordKey, topicGraph, type Records } from "../client/roadmaps/study-model";
import { StudySync, optimisticRecords, type Snapshot, type Store, type Transport } from "../client/roadmaps/sync";
import * as syncModule from "../client/roadmaps/sync";
import { ResourceLink, TaskDetail, StudyWorkspace, taskFromRoute } from "../client/roadmaps/study-workspace";
import { cloudRecords, cachedLibraryRows } from "../client/roadmaps/study-storage";
const value = fixture as RoadmapPackage;
const task = value.content.tasks[0].taskId;
const account = "6c0ea6ad-0d8e-44e4-a7c3-5545e45b5a16";
const mutation = (kind: string, changes: object, base = {}, baselineRevision = 0) => learnerMutationSchema.parse({ mutationId: crypto.randomUUID(), accountId: account, roadmapId: value.roadmap.roadmapId, entityId: task, baselineRevision, base, payload: { kind, changes } });
function setup(initial?: Snapshot) {
  const snapshots = new Map<string, Snapshot>();
  const store: Store = { async read(a,r) { return structuredClone(snapshots.get(`${a}:${r}`)); }, async write(s) { snapshots.set(`${s.accountId}:${s.roadmapId}`, structuredClone(s)); }, async list(a) { return [...snapshots.values()].filter(s => s.accountId === a); }, async clear(a) { for (const [key,s] of snapshots) if (s.accountId === a) snapshots.delete(key); } };
  let online = false;
  const records: Records = {};
  const receipts = new Map<string, Awaited<ReturnType<Transport["send"]>>>();
  const send = vi.fn(async (m: LearnerMutation) => {
    if (receipts.has(m.mutationId)) return receipts.get(m.mutationId)!;
    const key = recordKey(m.payload.kind,m.entityId);
    const result = mergeLearnerMutation(records[key] ?? { revision: 0, data: defaultLearnerFields(m.payload.kind) },m);
    if (result.status === "acknowledged") records[key] = result.record;
    receipts.set(m.mutationId,result); return result;
  });
  const transport = { read: async () => structuredClone(records), send };
  const snapshot = initial ?? { accountId:account,roadmapId:value.roadmap.roadmapId,package:value,records:{},outbox:[] };
  const engine = new StudySync(snapshot,store,transport,()=>{},()=>online);
  return { engine,store,records,receipts,send,transport,snapshots,connect() { online=true; } };
}

describe("study workflows",()=>{
  it("excludes optional and removed tasks and handles zero required tasks",()=>{
    const records = Object.fromEntries([...value.content.tasks.map(t=>t.taskId),crypto.randomUUID()].map(id=>[recordKey("completion",id),{revision:1,data:{state:"completed"}}]));
    expect(requiredProgress(value,records).percent).toBe(100);
    const optional=structuredClone(value); optional.content.tasks.forEach(t=>t.required=false);
    expect(requiredProgress(optional,records)).toEqual({completed:0,total:0,percent:null});
  });
  it("uses eligible study days for offsets without UTC date shifts",()=>{
    const schedule={...value.schedules[0],startDate:"2026-10-09",length:3,dayBasis:"study-days" as const,studyDays:[1,2,3,4,5]};
    const a={assignmentId:crypto.randomUUID(),taskId:task,dayOffset:1};
    expect(assignedDate(schedule,a,{})).toBe("2026-10-12");
    expect(addDays("2026-12-31",1)).toBe("2027-01-01");
  });
  it("moves only one assignment and warns on capacity and prerequisite violations",()=>{
    const schedule=value.schedules[0]; const a=schedule.assignments[1];
    const records={ [recordKey("assignment",a.assignmentId)]: {revision:1,data:{scheduleId:schedule.scheduleId,date:schedule.startDate}} };
    const result=scheduleWarnings(value,schedule,records);
    expect(result.warnings.some(w=>w.includes("prerequisite"))).toBe(true);
    expect(result.warnings.some(w=>w.includes("capacity"))).toBe(true);
    expect(assignedDate(schedule,schedule.assignments[0],records)).toBe(schedule.startDate);
    expect(requiredProgress(value,records).completed).toBe(0);
  });
  it("keeps task completion independent from notes and topic mastery",()=>{
    const state=setup(); const note=mutation("note",{text:"Evidence"},{text:""});
    state.engine.snapshot.outbox.push({mutation:note,status:"pending"});
    expect(requiredProgress(value,optimisticRecords(state.engine.snapshot)).completed).toBe(0);
  });
  it("escapes imported content and refuses unsafe resource links",()=>{
    const resource={...value.content.resources[0],title:'<img src=x onerror=alert(1)>',url:'javascript:alert(1)'};
    const html=renderToStaticMarkup(createElement(ResourceLink,{resource}));
    expect(html).toContain('&lt;img'); expect(html).not.toContain('href='); expect(html).toContain('Reference only');
  });
  it("styles provider resources and derives official YouTube thumbnails",()=>{
    const github={...value.content.resources[0],sourceType:"repository",url:"https://github.com/example/project"};
    const roadmap={...value.content.resources[0],sourceType:"guide",url:"https://roadmap.sh/python"};
    const video={...value.content.resources[0],sourceType:"video",url:"https://www.youtube.com/watch?v=abcdefghijk"};
    expect(renderToStaticMarkup(createElement(ResourceLink,{resource:github}))).toContain("provider-github");
    expect(renderToStaticMarkup(createElement(ResourceLink,{resource:roadmap}))).toContain("provider-roadmap");
    expect(renderToStaticMarkup(createElement(ResourceLink,{resource:video}))).toContain("https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg");
  });
  it("normalizes cloud timestamp fields to match queued baselines",async()=>{
    const records=await cloudRecords(async table=>table==='roadmap_task_progress'?[{task_id:task,state:'completed',completed_at:'2026-10-11T02:00:00+00:00',revision:2}]:[]);
    expect(records[recordKey('completion',task)].data.completedAt).toBe('2026-10-11T02:00:00.000Z');
  });
  it("lays out prerequisites before dependent topics and rejects unresolved graph edges",()=>{
    const nodes=topicGraph([...value.content.topics].reverse());
    const dependent=nodes.find(n=>n.topic.prerequisiteTopicIds.length)!;
    expect(dependent.x).toBeGreaterThan(nodes.find(n=>n.topic.topicId===dependent.topic.prerequisiteTopicIds[0])!.x);
    expect(()=>topicGraph([{...value.content.topics[0],prerequisiteTopicIds:[crypto.randomUUID()]}])).toThrow('unresolved');
  });
  it("renders task details as a full page with its assigned resources",async()=>{
    const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3000'});
    vi.stubGlobal('window',dom.window); vi.stubGlobal('document',dom.window.document); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
    const root=createRoot(dom.window.document.getElementById('root')!); const closed=vi.fn();
    try {
      await act(async()=>root.render(createElement(StrictMode,null,createElement(TaskDetail,{task:value.content.tasks[0],value,records:{},sync:setup().engine,close:closed}))));
      expect(dom.window.document.querySelector('dialog')).toBeNull();
      expect(dom.window.document.querySelector('.study-task-page h2')?.textContent).toBe(value.content.tasks[0].title);
      expect(dom.window.document.querySelector('.study-task-page h3')?.textContent).toBe("Objective");
      expect(closed).not.toHaveBeenCalled();
    } finally { await act(async()=>root.unmount()); vi.unstubAllGlobals(); dom.window.close(); }
  });
});

describe("durable ordered sync",()=>{
  it("does not replace an unread cache with an empty queue",async()=>{
    const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3000'});
    const state=setup(); const write=vi.fn(state.store.write); const loadPackage=vi.fn(async()=>value);
    const cache=vi.spyOn(syncModule,"indexedStore").mockReturnValue({...state.store,read:async()=>{throw new Error("storage denied");},write});
    vi.stubGlobal('window',dom.window); vi.stubGlobal('document',dom.window.document); vi.stubGlobal('location',dom.window.location); vi.stubGlobal('localStorage',dom.window.localStorage); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
    vi.stubGlobal('navigator',{onLine:true,locks:{request:async (_name:any,_options:any,callback:any)=>callback()}});
    const root=createRoot(dom.window.document.getElementById('root')!);
    try {
      await act(async()=>root.render(createElement(StudyWorkspace,{accountId:account,roadmapId:value.roadmap.roadmapId,choices:[],loadPackage,transport:state.transport,onChoose:()=>{},onBack:()=>{},onSignOut:async()=>{}})));
      expect(dom.window.document.body.textContent).toContain("unread queued work will not be overwritten");
      expect(write).not.toHaveBeenCalled(); expect(loadPackage).not.toHaveBeenCalled();
    } finally { await act(async()=>root.unmount()); cache.mockRestore(); vi.unstubAllGlobals(); dom.window.close(); }
  });
  it("retains a draft's baseline when remote data refreshes before Save",async()=>{
    const state=setup(); const baseline={revision:0,data:{text:""}};
    state.records[recordKey("note",task)]={revision:2,data:{text:"Remote while typing"}};
    state.connect(); await state.engine.flush();
    await state.engine.enqueue("note",task,{text:"My draft"},baseline);
    await vi.waitFor(()=>expect(state.engine.status()).toBe("conflict"));
    expect(state.engine.snapshot.outbox[0].remote!.data.text).toBe("Remote while typing");
    expect(state.engine.snapshot.outbox[0].mutation.payload.changes).toEqual({text:"My draft"});
  });
  it("does not reopen an old query-string task after navigating a study hash route",()=>{
    expect(taskFromRoute(`?task=${task}`,`#/study/${value.roadmap.roadmapId}/resources`)).toBe("");
    expect(taskFromRoute(`?task=${task}`,"")).toBe(task);
    expect(taskFromRoute("",`#/study/${value.roadmap.roadmapId}/overview?task=${task}`)).toBe(task);
  });
  it("offers cached plans only to the account that opened them",()=>{
    const snapshot=setup().engine.snapshot;
    const rows=cachedLibraryRows([snapshot,{...snapshot,accountId:"other"}],account);
    expect(rows).toHaveLength(1); expect(rows[0].roadmap_id).toBe(value.roadmap.roadmapId);
    expect(cachedLibraryRows([snapshot],"other")).toHaveLength(0);
  });
  it("refreshes definitions without losing pending learner edits",async()=>{
    const state=setup(); await state.engine.enqueue("note",task,{text:"Keep while refreshing"});
    const id=state.engine.snapshot.outbox[0].mutation.mutationId;
    const updated=structuredClone(value); updated.roadmap.title="Updated plan";
    await state.engine.updatePackage(updated);
    expect((await state.store.read(account,value.roadmap.roadmapId))!.package.roadmap.title).toBe("Updated plan");
    expect(state.engine.snapshot.outbox[0].mutation.mutationId).toBe(id);
    await expect(state.engine.updatePackage({...updated,roadmap:{...updated.roadmap,roadmapId:crypto.randomUUID()}})).rejects.toThrow("ownership");
  });
  it("persists optimistic edits offline and replays complete then reopen in order",async()=>{
    const state=setup();
    await state.engine.enqueue("completion",task,{state:"completed",completedAt:"2026-10-11T00:00:00.000Z"});
    await state.engine.enqueue("completion",task,{state:"incomplete",completedAt:null});
    expect(state.engine.status()).toBe("offline"); expect(state.engine.snapshot.outbox).toHaveLength(2);
    expect((await state.store.read(account,value.roadmap.roadmapId))!.outbox).toHaveLength(2);
    state.connect(); await state.engine.flush();
    expect(state.engine.snapshot.outbox).toHaveLength(0); expect(state.records[recordKey("completion",task)].data.state).toBe("incomplete"); expect(state.engine.status()).toBe("synced");
  });
  it("recovers the same mutation IDs after page closure",async()=>{
    const original=setup(); await original.engine.enqueue("note",task,{text:"Survives closure"});
    const saved=await original.store.read(account,value.roadmap.roadmapId);
    const mutationId=saved!.outbox[0].mutation.mutationId;
    original.engine.stop(); const reopened=setup(saved); reopened.connect(); await reopened.engine.flush();
    expect(reopened.send.mock.calls[0][0].mutationId).toBe(mutationId);
    expect(reopened.records[recordKey("note",task)].data.text).toBe("Survives closure");
  });
  it("retries a lost acknowledgement without duplicating a study-time entry",async()=>{
    const state=setup(); await state.engine.enqueue("study-time",crypto.randomUUID(),{taskId:task,minutes:15,recordedAt:"2026-10-11T00:00:00.000Z"});
    const realSend=state.transport.send; let first=true;
    state.transport.send=async m=>{const result=await realSend(m); if(first){first=false;throw new Error("lost ack");}return result;};
    state.connect(); await state.engine.flush(); expect(state.engine.status()).toBe("error"); expect(state.engine.snapshot.outbox).toHaveLength(1);
    await state.engine.flush(); expect(state.engine.snapshot.outbox).toHaveLength(0); expect(Object.keys(state.records)).toHaveLength(1); expect(state.receipts.size).toBe(1);
  });
  it("merges different mastery fields from a stale baseline",()=>{
    const m=mutation("mastery",{evidence:"My example"},{state:"not-assessed",evidence:""});
    const result=mergeLearnerMutation({revision:5,data:{state:"developing",evidence:""}},m);
    expect(result.status).toBe("acknowledged"); expect(result.record.data).toEqual({state:"developing",evidence:"My example"});
  });
  it("preserves both conflicting notes and lets the learner combine them",async()=>{
    const state=setup(); await state.engine.enqueue("note",task,{text:"Local note"});
    state.records[recordKey("note",task)]={revision:4,data:{text:"Remote note"}};
    state.connect(); await state.engine.flush(); expect(state.engine.status()).toBe("conflict");
    const pending=state.engine.snapshot.outbox[0]; expect(pending.remote!.data.text).toBe("Remote note"); expect(pending.mutation.payload.changes).toEqual({text:"Local note"});
    const oldId=pending.mutation.mutationId; await state.engine.resolve(oldId,true,"Local note\nRemote note"); await vi.waitFor(()=>expect(state.engine.snapshot.outbox).toHaveLength(0));
    expect(state.records[recordKey("note",task)].data.text).toBe("Local note\nRemote note"); expect(state.send.mock.calls.at(-1)![0].mutationId).not.toBe(oldId);
  });
  it("surfaces concurrent completion versus reopening conflicts",()=>{
    const m=mutation("completion",{state:"incomplete",completedAt:null},{state:"completed",completedAt:"2026-10-10T00:00:00.000Z"},1);
    expect(mergeLearnerMutation({revision:2,data:{state:"completed",completedAt:"2026-10-11T00:00:00.000Z"}},m).status).toBe("conflict");
  });
  it("keeps a failed cache write recoverable in memory and never labels it synced",async()=>{
    const state=setup(); state.store.write=async()=>{throw new Error("quota");};
    await state.engine.enqueue("note",task,{text:"Recoverable"}); expect(state.engine.snapshot.outbox).toHaveLength(1); expect(state.engine.status()).toBe("error"); expect(state.engine.error).toContain("Export");
  });
  it("isolates accounts and clears only the selected account",async()=>{
    const state=setup(); await state.engine.enqueue("note",task,{text:"Private"});
    await state.store.write({...state.engine.snapshot,accountId:"other",outbox:[]});
    expect((await state.store.list("other"))[0].outbox).toHaveLength(0);
    await state.store.clear("other"); expect((await state.store.list(account))[0].outbox).toHaveLength(1);
  });
  it("rejects bad payloads without poisoning later valid edits",async()=>{
    const state=setup(); await expect(state.engine.enqueue("study-time",task,{minutes:0} as any)).rejects.toThrow();
    await state.engine.enqueue("note",task,{text:"Valid"}); expect(state.engine.snapshot.outbox).toHaveLength(1);
  });
  it("does not consume responses after the account workspace has been disposed",async()=>{
    const state=setup(); await state.engine.enqueue("note",task,{text:"Pending"});
    let release!: (value:any)=>void; state.transport.send=()=>new Promise(resolve=>{release=resolve;});
    state.connect(); const work=state.engine.flush(); await vi.waitFor(()=>expect(release).toBeDefined()); state.engine.stop(); release({status:"acknowledged",record:{revision:1,data:{text:"Pending"}}}); await work;
    expect(state.engine.snapshot.outbox).toHaveLength(1);
  });
});
