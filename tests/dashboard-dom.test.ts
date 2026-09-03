import { describe, expect, it } from "vitest";
import { bootApp, byId, stored, text } from "./helpers";

describe("dashboard DOM smoke test (real HTML + module, jsdom)", () => {
  it("renders all track cards on boot without a session", async () => {
    const { doc } = await bootApp();
    expect(doc.querySelectorAll("#checkpoints .track-card").length).toBe(6);
    expect(text(byId(doc, "workbenchCount"))).toBe("0 completed");
    expect(text(byId(doc, "statOpen"))).toBe("76");
    expect(byId(doc, "authScreen")!.hasAttribute("hidden")).toBe(false);
  });

  it("checking a checkpoint updates metrics, activity, and localStorage; unchecking reverts", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();

    const check = doc.querySelector<HTMLInputElement>(
      '.task-row[data-task-id="python-1"] .check'
    )!;
    check.click();

    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(doc, "statOpen"))).toBe("75");
    expect(text(byId(doc, "statProof"))).toBe("10");
    expect(text(byId(doc, "statStreak"))).toBe("1");
    expect(text(byId(doc, "focusCount"))).toBe("1 / 12");
    expect(text(byId(doc, "calendarSummary"))).toMatch(
      /1 active days · 1 completions/
    );

    const saved = stored(doc)!;
    const activity = saved.activity as Record<string, number>;
    expect((saved.completed as Record<string, boolean>)["python-1"]).toBe(true);
    expect((saved.completedAt as Record<string, string>)["python-1"]).toBe(
      today
    );
    expect(activity[today]).toBe(1);

    // Uncheck: everything must revert and activity for today must be removed.
    // (renderTracks re-created the rows, so query the live checkbox again.)
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    expect(text(byId(doc, "workbenchCount"))).toBe("0 completed");
    expect(text(byId(doc, "statProof"))).toBe("0");
    expect(text(byId(doc, "statStreak"))).toBe("0");
    const after = stored(doc)!;
    expect((after.completed as Record<string, boolean>)["python-1"]).toBe(
      false
    );
    expect((after.activity as Record<string, number>)[today]).toBeUndefined();
  });

  it("adds and checks off a custom task through the real form", async () => {
    const { doc } = await bootApp();
    const input = doc.getElementById("customTaskInput") as HTMLInputElement;
    input.value = "Review Java interfaces";
    const form = doc.getElementById("customForm")!;
    form.dispatchEvent(
      new doc.defaultView!.Event("submit", { bubbles: true, cancelable: true })
    );

    expect(text(byId(doc, "customTaskCount"))).toBe("1 open · 1 total");
    expect(text(byId(doc, "deviceProgress"))).toBe("0 / 77");
    expect(doc.querySelectorAll("#customTasks .custom-row").length).toBe(1);

    const customCheck = doc.querySelector<HTMLInputElement>(
      "[data-custom-check]"
    )!;
    customCheck.click();
    expect(text(byId(doc, "customTaskCount"))).toBe("0 open · 1 total");
    expect(text(byId(doc, "statProof"))).toBe("10");
    expect(text(byId(doc, "statStreak"))).toBe("1");
  });

  it("persists a completed checkpoint across a simulated reload", async () => {
    const first = await bootApp();
    first.doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="java-1"] .check'
      )!
      .click();

    // Simulate a page reload: fresh DOM + module, but same persisted localStorage.
    const saved = first.doc.defaultView!.localStorage.getItem(
      "aster-study-dashboard-v3"
    )!;
    const second = await bootApp({
      preSeed: { "aster-study-dashboard-v3": saved },
    });
    expect(text(byId(second.doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(second.doc, "statOpen"))).toBe("75");
    expect(text(byId(second.doc, "statProof"))).toBe("10");
  });

  it("saves a resource card with a valid link", async () => {
    const { doc } = await bootApp();
    (doc.getElementById("resourceName") as HTMLInputElement).value =
      "30 Days of Python";
    (doc.getElementById("resourceUrl") as HTMLInputElement).value =
      "https://github.com/Asabeneh/30-Days-Of-Python";
    (doc.getElementById("resourceDescription") as HTMLInputElement).value =
      "Hands-on challenge";
    doc
      .getElementById("resourceForm")!
      .dispatchEvent(
        new doc.defaultView!.Event("submit", {
          bubbles: true,
          cancelable: true,
        })
      );

    expect(text(byId(doc, "resourceCount"))).toBe("1 saved");
    expect(doc.querySelectorAll("#resourceList .resource-item").length).toBe(1);
    const link = doc.querySelector<HTMLAnchorElement>(
      "#resourceList .resource-item a"
    );
    expect(link?.getAttribute("href")).toBe(
      "https://github.com/Asabeneh/30-Days-Of-Python"
    );
    expect(link?.getAttribute("rel")).toContain("noreferrer");
  });

  it("rejects invalid resource URLs without saving", async () => {
    const { doc } = await bootApp();
    (doc.getElementById("resourceName") as HTMLInputElement).value = "Evil";
    (doc.getElementById("resourceUrl") as HTMLInputElement).value =
      "javascript:alert(1)";
    doc
      .getElementById("resourceForm")!
      .dispatchEvent(
        new doc.defaultView!.Event("submit", {
          bubbles: true,
          cancelable: true,
        })
      );
    expect(text(byId(doc, "resourceCount"))).toBe("0 saved");
    expect(text(byId(doc, "toast"))).toContain("valid http(s) link");
  });
});

describe("custom task activity bookkeeping", () => {
  const addTask = (doc: Document, title: string) => {
    const input = doc.getElementById("customTaskInput") as HTMLInputElement;
    input.value = title;
    doc
      .getElementById("customForm")!
      .dispatchEvent(
        new doc.defaultView!.Event("submit", {
          bubbles: true,
          cancelable: true,
        })
      );
  };

  it("unchecking a completed custom task decrements activity, proof, and streak", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();

    addTask(doc, "Reversible task");
    doc.querySelector<HTMLInputElement>("[data-custom-check]")!.click();
    expect(text(byId(doc, "statProof"))).toBe("10");
    expect(text(byId(doc, "calendarSummary"))).toMatch(
      /1 active days · 1 completions/
    );

    // Uncheck: activity for today must be removed and metrics reset.
    doc.querySelector<HTMLInputElement>("[data-custom-check]")!.click();
    expect(text(byId(doc, "statProof"))).toBe("0");
    expect(text(byId(doc, "statStreak"))).toBe("0");
    expect(text(byId(doc, "calendarSummary"))).toBe(
      "No activity recorded yet."
    );
    expect(text(byId(doc, "customTaskCount"))).toBe("1 open · 1 total");

    const saved = stored(doc)!;
    expect(
      (saved.customTasks as Array<Record<string, unknown>>)[0].completed
    ).toBe(false);
    expect((saved.activity as Record<string, number>)[today]).toBeUndefined();
  });

  it("deleting a completed custom task removes it and decrements activity", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();

    addTask(doc, "Doomed completed task");
    doc.querySelector<HTMLInputElement>("[data-custom-check]")!.click();
    expect(text(byId(doc, "statProof"))).toBe("10");

    doc.querySelector<HTMLElement>("[data-custom-delete]")!.click();
    expect(text(byId(doc, "customTaskCount"))).toBe("0 open · 0 total");
    expect(doc.querySelectorAll("#customTasks .custom-row").length).toBe(0);
    expect(text(byId(doc, "statProof"))).toBe("0");
    expect(text(byId(doc, "statStreak"))).toBe("0");
    expect(text(byId(doc, "calendarSummary"))).toBe(
      "No activity recorded yet."
    );

    const saved = stored(doc)!;
    expect(saved.customTasks).toEqual([]);
    expect((saved.activity as Record<string, number>)[today]).toBeUndefined();
  });

  it("deleting an open custom task leaves activity untouched", async () => {
    const { doc } = await bootApp();
    const check = doc.querySelector<HTMLInputElement>(
      '.task-row[data-task-id="python-1"] .check'
    )!;
    check.click(); // one real checkpoint completion to seed activity
    expect(text(byId(doc, "statProof"))).toBe("10");

    addTask(doc, "Open task to delete");
    doc.querySelector<HTMLElement>("[data-custom-delete]")!.click();

    expect(text(byId(doc, "customTaskCount"))).toBe("0 open · 0 total");
    expect(text(byId(doc, "statProof"))).toBe("10"); // still just the checkpoint
    expect(text(byId(doc, "statStreak"))).toBe("1");
    expect(text(byId(doc, "calendarSummary"))).toMatch(
      /1 active days · 1 completions/
    );
  });
});
