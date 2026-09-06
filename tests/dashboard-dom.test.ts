import { describe, expect, it, vi } from "vitest";
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

  it("persists an optional due date and highlights overdue custom tasks", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();
    const input = doc.getElementById("customTaskInput") as HTMLInputElement;
    const due = doc.getElementById("customDue") as HTMLInputElement;
    const form = doc.getElementById("customForm")!;
    const submit = () =>
      form.dispatchEvent(
        new doc.defaultView!.Event("submit", {
          bubbles: true,
          cancelable: true,
        })
      );

    // Past due date: the row is marked overdue with a pill, and dueDate persists.
    input.value = "Finish lab report";
    due.value = "2020-01-01";
    submit();
    let row = doc.querySelector(
      "#customTasks .custom-row"
    ) as HTMLElement;
    expect(row.classList.contains("overdue")).toBe(true);
    expect(row.textContent).toContain("Overdue");
    expect(
      (stored(doc)!.customTasks as Array<Record<string, unknown>>)[0]
        .dueDate
    ).toBe("2020-01-01");

    // Due today: shown as "Due today", not overdue.
    input.value = "Review notes";
    due.value = today;
    submit();
    row = doc.querySelectorAll("#customTasks .custom-row")[1] as HTMLElement;
    expect(row.classList.contains("overdue")).toBe(false);
    expect(row.textContent).toContain("Due today");

    // Future due date: not overdue.
    input.value = "Plan Java week";
    due.value = "2099-01-01";
    submit();
    row = doc.querySelectorAll("#customTasks .custom-row")[2] as HTMLElement;
    expect(row.classList.contains("overdue")).toBe(false);
    expect(row.textContent).toContain("Due Jan 1");

    // Completing an overdue task clears the overdue state.
    doc
      .querySelector<HTMLInputElement>("#customTasks [data-custom-check]")
      .click();
    row = doc.querySelector("#customTasks .custom-row") as HTMLElement;
    expect(row.classList.contains("done")).toBe(true);
    expect(row.classList.contains("overdue")).toBe(false);

    // No due date: keeps the legacy "added" meta.
    input.value = "No deadline";
    due.value = "";
    submit();
    row = doc.querySelectorAll("#customTasks .custom-row")[3] as HTMLElement;
    expect(row.classList.contains("overdue")).toBe(false);
    expect(row.textContent).toContain("added");
    expect(
      (stored(doc)!.customTasks as Array<Record<string, unknown>>)[3].dueDate
    ).toBeNull();
  });

  it("logs focus minutes into state, the weekly chart, and today's total", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();

    // Fake only the interval so real dates keep flowing.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    (doc.getElementById("timerStart") as HTMLButtonElement).click();
    vi.advanceTimersByTime(60_000); // one whole minute of focus
    (doc.getElementById("timerPause") as HTMLButtonElement).click();
    vi.useRealTimers();

    const saved = stored(doc)!;
    const focus = saved.focus as {
      days: Record<string, number>;
      sessions: Array<{ date: string; minutes: number }>;
    };
    expect(focus.days[today]).toBe(1);
    expect(focus.sessions).toEqual([{ date: today, minutes: 1 }]);
    expect(text(byId(doc, "focusToday"))).toBe("1m today");
    expect(text(byId(doc, "weeklyFocusNote"))).toContain("1m focused");
    expect(text(byId(doc, "calendarSummary"))).toContain("focused");
    expect(text(byId(doc, "timerText"))).toBe("01:00");

    const todayColumn = [...doc.querySelectorAll("#focusBars .weekly-column")].find(
      column => column.classList.contains("today")
    );
    expect(todayColumn?.querySelector(".weekly-value")?.textContent).toBe("1");
  });

  it("records focus when a running timer is reset", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();

    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    (doc.getElementById("timerStart") as HTMLButtonElement).click();
    vi.advanceTimersByTime(90_000);
    (doc.getElementById("timerReset") as HTMLButtonElement).click();
    vi.useRealTimers();

    const focus = (stored(doc)!.focus as {
      days: Record<string, number>;
      sessions: Array<{ date: string; minutes: number }>;
    });
    // 90 seconds rounds to 2 committed minutes, then reset closes the session.
    expect(focus.days[today]).toBe(2);
    expect(focus.sessions).toEqual([{ date: today, minutes: 2 }]);
    expect(text(byId(doc, "timerText"))).toBe("00:00");
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

describe("cookie consent banner", () => {
  it("shows on first visit; Accept dismisses it and persists the choice", async () => {
    const { doc, win } = await bootApp();
    const banner = byId(doc, "cookieBanner")!;
    expect(banner.hasAttribute("hidden")).toBe(false);
    byId(doc, "cookieAccept")!.click();
    expect(banner.hasAttribute("hidden")).toBe(true);
    expect(win.localStorage.getItem("semassist-cookie-consent")).toBe(
      "accepted"
    );
  });

  it("Decline dismisses it too and records the choice", async () => {
    const { doc, win } = await bootApp();
    byId(doc, "cookieDecline")!.click();
    expect(byId(doc, "cookieBanner")!.hasAttribute("hidden")).toBe(true);
    expect(win.localStorage.getItem("semassist-cookie-consent")).toBe(
      "declined"
    );
  });

  it("stays hidden when a consent choice was already stored", async () => {
    const { doc } = await bootApp({
      preSeed: { "semassist-cookie-consent": "accepted" },
    });
    expect(byId(doc, "cookieBanner")!.hasAttribute("hidden")).toBe(true);
  });

  it("moves focus into the banner on first visit", async () => {
    const { doc } = await bootApp();
    expect(doc.activeElement).toBe(byId(doc, "cookieAccept"));
  });

  it("returns focus out of the banner once a choice is made", async () => {
    const { doc } = await bootApp();
    byId(doc, "cookieDecline")!.click();
    expect(doc.activeElement).toBe(doc.body);
    expect(byId(doc, "cookieBanner")!.hasAttribute("hidden")).toBe(true);
  });

  it("gives glyph-only controls accessible names", async () => {
    const { doc } = await bootApp();
    expect(byId(doc, "timerStart")!.getAttribute("aria-label")).toBe(
      "Start focus timer"
    );
    expect(byId(doc, "timerPause")!.getAttribute("aria-label")).toBe(
      "Pause focus timer"
    );
    expect(byId(doc, "timerReset")!.getAttribute("aria-label")).toBe(
      "Reset focus timer"
    );
    expect(byId(doc, "search")!.getAttribute("aria-label")).toBe(
      "Find a checkpoint"
    );
    expect(
      byId(doc, "cookieBanner")!.getAttribute("aria-label")
    ).toBe("Cookie consent");
  });
});

describe("resource canvas keyboard positioning", () => {
  const addResource = (doc: Document) => {
    (doc.getElementById("resourceName") as HTMLInputElement).value =
      "30 Days of Python";
    (doc.getElementById("resourceUrl") as HTMLInputElement).value =
      "https://github.com/Asabeneh/30-Days-Of-Python";
    doc
      .getElementById("resourceForm")!
      .dispatchEvent(
        new doc.defaultView!.Event("submit", {
          bubbles: true,
          cancelable: true,
        })
      );
    return doc.querySelector<HTMLElement>("#resourceList .resource-item")!;
  };

  // jsdom has no layout engine (clientWidth/offsetWidth are 0), so stub the
  // canvas metrics the clamping logic relies on.
  const setCanvasMetrics = (doc: Document, item: HTMLElement) => {
    const list = byId(doc, "resourceList")!;
    Object.defineProperty(list, "clientWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(list, "clientHeight", {
      configurable: true,
      value: 430,
    });
    Object.defineProperty(item, "offsetWidth", {
      configurable: true,
      value: 220,
    });
    Object.defineProperty(item, "offsetHeight", {
      configurable: true,
      value: 90,
    });
  };

  const key = (doc: Document, target: Element, keyName: string, shift = false) =>
    target.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: keyName,
        bubbles: true,
        cancelable: true,
        shiftKey: shift,
      })
    );

  it("resource cards are keyboard-focusable", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    expect(item.getAttribute("tabindex")).toBe("0");
  });

  it("arrow keys nudge a card and persist the new position", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    expect(item.style.left).toBe("18px");

    key(doc, item, "ArrowRight");
    key(doc, item, "ArrowDown");

    expect(item.style.left).toBe("28px");
    expect(item.style.top).toBe("28px");
    const saved = stored(doc)!;
    const resource = (saved.resources as Array<Record<string, unknown>>)[0];
    expect(resource.x).toBe(28);
    expect(resource.y).toBe(28);
  });

  it("shift + arrow moves in a larger step", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    key(doc, item, "ArrowRight", true);
    expect(item.style.left).toBe("68px");
  });

  it("clamps movement at the canvas edges", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    item.style.left = "600px";
    key(doc, item, "ArrowRight");
    expect(item.style.left).toBe("410px"); // 640 - 220 - 10
    item.style.top = "5px";
    key(doc, item, "ArrowUp");
    expect(item.style.top).toBe("10px");
  });

  it("Enter persists the current position and confirms it", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    item.style.left = "77px";
    item.style.top = "99px";
    key(doc, item, "Enter");
    const saved = stored(doc)!;
    const resource = (saved.resources as Array<Record<string, unknown>>)[0];
    expect(resource.x).toBe(77);
    expect(resource.y).toBe(99);
    expect(text(byId(doc, "toast"))).toContain("Position saved");
  });

  it("does not move the card while its inner delete button is focused", async () => {
    const { doc } = await bootApp();
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    const del = item.querySelector<HTMLElement>("[data-resource-delete]")!;
    key(doc, del, "ArrowRight");
    expect(item.style.left).toBe("18px");
  });

  it("snap toggle defaults to off and persists its choice", async () => {
    const { doc } = await bootApp();
    const toggle = byId(doc, "resourceSnap") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    toggle.checked = true;
    toggle.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
    expect(doc.defaultView!.localStorage.getItem("semassist-resource-snap")).toBe(
      "on"
    );
    const reloaded = await bootApp({
      preSeed: { "semassist-resource-snap": "on" },
    });
    expect(
      (byId(reloaded.doc, "resourceSnap") as HTMLInputElement).checked
    ).toBe(true);
  });

  it("arrow keys snap to the 18px grid when snap is on", async () => {
    const { doc } = await bootApp({
      preSeed: { "semassist-resource-snap": "on" },
    });
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    expect(item.style.left).toBe("18px");

    key(doc, item, "ArrowRight"); // 18 + 10 = 28 → nearest 18-multiple = 36
    key(doc, item, "ArrowDown");

    expect(item.style.left).toBe("36px");
    expect(item.style.top).toBe("36px");
    const saved = stored(doc)!;
    const resource = (saved.resources as Array<Record<string, unknown>>)[0];
    expect(resource.x).toBe(36);
    expect(resource.y).toBe(36);
  });

  it("drag release snaps to the grid when snap is on", async () => {
    const { doc } = await bootApp({
      preSeed: { "semassist-resource-snap": "on" },
    });
    const item = addResource(doc);
    setCanvasMetrics(doc, item);
    (item as unknown as { setPointerCapture: () => void }).setPointerCapture =
      () => {};
    const fire = (type: string, clientX: number, clientY: number) => {
      const event = new doc.defaultView!.Event(type, {
        bubbles: true,
        cancelable: true,
      }) as Event & {
        clientX: number;
        clientY: number;
        pointerId: number;
      };
      event.clientX = clientX;
      event.clientY = clientY;
      event.pointerId = 1;
      item.dispatchEvent(event);
    };
    fire("pointerdown", 0, 0);
    fire("pointermove", 46, 23); // raw target 46,23 → snapped 54,18
    fire("pointerup", 46, 23);

    expect(item.style.left).toBe("54px");
    expect(item.style.top).toBe("18px");
    const saved = stored(doc)!;
    const resource = (saved.resources as Array<Record<string, unknown>>)[0];
    expect(resource.x).toBe(54);
    expect(resource.y).toBe(18);
  });
});
