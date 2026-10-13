import { afterEach, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import React, { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import fixture from "../examples/beginner-python.json";
import replanned from "../examples/replanned-python.json";
import { validatePackage, packageSchema } from "../packages/roadmap-schema/src/index";
import { demoKey, readDemoBackup, writeDemoBackup } from "../client/roadmaps/demo-account";
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: () => ({}) }));
vi.mock("../client/roadmaps/sync", async original => ({ ...await original<object>(), indexedStore: () => ({ list: async () => [], clear: async () => {} }) }));
let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function setup() {
  const dom = new JSDOM("<div id='root'></div>", { url: "http://localhost:3000/roadmaps.html?demo=1" });
  for (const key of ["window", "document", "navigator", "location", "history", "localStorage", "parent"]) vi.stubGlobal(key, key === "parent" ? { postMessage() {} } : dom.window[key as keyof Window]);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  localStorage.setItem(demoKey, JSON.stringify([{ roadmap_id: fixture.roadmap.roadmapId, archived_at: null }]));
  localStorage.setItem(`${demoKey}:${fixture.roadmap.roadmapId}`, JSON.stringify(fixture));
  localStorage.setItem(`semassist-study-demo-server:${fixture.roadmap.roadmapId}`, JSON.stringify({ records: { [`note:${fixture.content.tasks[0].taskId}`]: { revision: 1, data: { text: "private note" } } } }));
  const downloads: Blob[] = [];
  vi.spyOn(URL, "createObjectURL").mockImplementation(blob => { downloads.push(blob as Blob); return "blob:test"; });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(dom.window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.spyOn(dom.window, "confirm").mockReturnValue(true);
  const { RoadmapLibrary } = await import("../client/roadmaps/roadmap-library");
  root = createRoot(document.getElementById("root")!);
  await act(async () => root!.render(createElement(RoadmapLibrary)));
  async function click(text: string) { const button = [...document.querySelectorAll("button")].find(b => b.textContent === text)!; expect(button).toBeDefined(); await act(async () => { button.click(); await new Promise(r => setTimeout(r, 30)); }); }
  return { dom, downloads, click };
}
it("downloads private backups and notes-free replans through the real library controls", async () => {
  const { downloads, click } = await setup();
  await click("Back up account");
  expect(JSON.parse(await downloads[0].text()).roadmaps[0].records[0].data.text).toBe("private note");
  await click("Replan & schedules"); await click("Export replanning snapshot");
  const snapshot = JSON.parse(await downloads[1].text()); expect(snapshot.baseline.learnerRevision).toBe(1); expect(JSON.stringify(snapshot)).not.toContain("private note");
  expect(document.body.textContent).toContain("Replanning snapshot downloaded");
});
it("rejects a stale merge preview before writing or downloading", async () => {
  const { downloads, click, dom } = await setup();
  const backup = readDemoBackup();
  const input = [...document.querySelectorAll<HTMLInputElement>("input[type=file]")].find(e => e.parentElement?.textContent === "Restore backup")!;
  Object.defineProperty(input, "files", { value: [new File([JSON.stringify(backup)], "backup.json", { type: "application/json" })] });
  await act(async () => { input.dispatchEvent(new dom.window.Event("change", { bubbles: true })); await new Promise(r => setTimeout(r, 30)); });
  expect(document.body.textContent).toContain("1 colliding roadmap IDs");
  const newer = readDemoBackup(); newer.roadmaps[0].records[0].data.text = "newer note"; newer.roadmaps[0].learnerRevision++; writeDemoBackup(newer);
  await click("Confirm restore"); expect(document.body.textContent).toContain("Account changed since preview"); expect(downloads).toHaveLength(0);
});
it("restores a merge preview without changing colliding notes and downloads a recovery copy", async () => {
  const { downloads, click, dom } = await setup();
  const backup = readDemoBackup();
  const input = [...document.querySelectorAll<HTMLInputElement>("input[type=file]")].find(e => e.parentElement?.textContent === "Restore backup")!;
  Object.defineProperty(input, "files", { value: [new File([JSON.stringify(backup)], "backup.json", { type: "application/json" })] });
  await act(async () => { input.dispatchEvent(new dom.window.Event("change", { bubbles: true })); await new Promise(r => setTimeout(r, 30)); });
  await click("Confirm restore");
  expect(document.body.textContent).toContain("Backup restored");
  expect(readDemoBackup().roadmaps).toEqual(backup.roadmaps);
  expect(JSON.parse(await downloads[0].text()).roadmaps[0].records[0].data.text).toBe("private note");
});
it("duplicates a replan with fresh IDs, required coverage and visible workload overrides", async () => {
  await setup();
  const { newIdentity } = await import("../client/roadmaps/roadmap-library");
  const source = packageSchema.parse(replanned); source.schedules[0].dailyCapacityMinutes = 15;
  const copy = newIdentity(source), checked = validatePackage(copy);
  expect(checked.success).toBe(true);
  expect(copy.roadmap.roadmapId).not.toBe(source.roadmap.roadmapId);
  expect(copy.baseline).toBeUndefined(); expect(copy.content.predecessorRevisionId).toBeUndefined();
  expect(copy.schedules[0].assignments).toHaveLength(3);
  if (checked.success) expect(checked.warnings.some(w => w.message.includes("capacity"))).toBe(true);
});
