import { describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  USER_STORAGE_KEY,
  bootApp,
  byId,
  makeFakeSupabase,
  stored,
  text,
} from "./helpers";

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

  it("expands cards with matches while searching, then collapses when cleared", async () => {
    const { doc } = await bootApp();
    const search = doc.getElementById("search") as HTMLInputElement;
    const cards = () =>
      [...doc.querySelectorAll<HTMLElement>("#checkpoints .track-card")];

    // Idle: collapsed tiles, nothing force-expanded.
    expect(cards().length).toBe(6);
    expect(cards().every(card => !card.classList.contains("expanded"))).toBe(
      true
    );

    // Searching expands every card that still has a visible match.
    search.value = "linked list";
    search.dispatchEvent(
      new doc.defaultView!.Event("input", { bubbles: true })
    );
    const expanded = cards().filter(card =>
      card.classList.contains("expanded")
    );
    expect(expanded.length).toBeGreaterThan(0);
    expect(
      expanded.every(
        card =>
          card.querySelectorAll(".task-row:not(.hidden)").length > 0
      )
    ).toBe(true);

    // Clearing the search restores the collapsed tile state.
    search.value = "";
    search.dispatchEvent(
      new doc.defaultView!.Event("input", { bubbles: true })
    );
    expect(cards().every(card => !card.classList.contains("expanded"))).toBe(
      true
    );
    expect(
      doc.querySelectorAll<HTMLElement>("#checkpoints .task-row.hidden").length
    ).toBe(0);
  });

  it("toggles a tile open on header click and keeps it open when ticking tasks", async () => {
    const { doc } = await bootApp();
    const java = doc.getElementById("java")!;
    const click = (el: Element) =>
      el.dispatchEvent(
        new doc.defaultView!.MouseEvent("click", { bubbles: true })
      );

    expect(java.classList.contains("open")).toBe(false);
    // Collapsed lists stay absolutely positioned so closing never reflows the grid.
    expect(
      doc.defaultView!.getComputedStyle(java.querySelector(".task-list")!)
        .position
    ).toBe("absolute");
    click(java.querySelector(".track-head")!);
    expect(java.classList.contains("open")).toBe(true);
    expect(java.getAttribute("aria-expanded")).toBe("true");

    // Clicking the roadmap link must not toggle the tile.
    click(java.querySelector(".source-link")!);
    expect(java.classList.contains("open")).toBe(true);

    // Ticking a task re-renders the cards but keeps the tile open.
    (java.querySelector(".check") as HTMLInputElement).click();
    expect(doc.getElementById("java")!.classList.contains("open")).toBe(
      true
    );

    // Clicking inside the task list does not collapse the tile.
    click(doc.getElementById("java")!.querySelector(".task-row")!);
    expect(doc.getElementById("java")!.classList.contains("open")).toBe(
      true
    );

    // Enter on the focused header toggles it closed (keyboard parity).
    const head = doc.getElementById("java")!.querySelector(".track-head")!;
    (head as HTMLElement).focus();
    head.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      })
    );
    expect(doc.getElementById("java")!.classList.contains("open")).toBe(
      false
    );
    expect(doc.getElementById("java")!.getAttribute("aria-expanded")).toBe(
      "false"
    );
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

describe("checkpoint queue mission card", () => {
  it("lists the next three unchecked checkpoints and verifies one on click", async () => {
    const { doc } = await bootApp();
    const rows = () =>
      [...doc.querySelectorAll<HTMLElement>("#missionQueue .queue-row")];

    expect(text(byId(doc, "deviceProgress"))).toBe("0 / 76");
    expect(rows().map(row => row.dataset.qid)).toEqual([
      "python-1",
      "python-2",
      "python-3",
    ]);
    expect(rows()[0].querySelector(".queue-main small")!.textContent).toContain(
      "Python · BASICS"
    );

    rows()[0].click();
    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(doc, "focusCount"))).toBe("1 / 12");
    // The queue advances: the verified step is replaced by the next one.
    expect(rows().map(row => row.dataset.qid)).toEqual([
      "python-2",
      "python-3",
      "python-4",
    ]);
    expect((stored(doc)!.completed as Record<string, boolean>)["python-1"]).toBe(
      true
    );
  });

  it("focus picker narrows the queue to one track and persists the choice", async () => {
    const { doc } = await bootApp();
    const select = doc.getElementById("queueFocus") as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual([
      "all",
      "python",
      "python30",
      "java",
      "os",
      "algorithms",
      "campusops",
    ]);

    select.value = "java";
    select.dispatchEvent(
      new doc.defaultView!.Event("change", { bubbles: true })
    );
    const rows = () =>
      [...doc.querySelectorAll<HTMLElement>("#missionQueue .queue-row")];
    expect(rows().map(row => row.dataset.qid)).toEqual([
      "java-1",
      "java-2",
      "java-3",
    ]);
    expect(rows()[0].querySelector(".queue-main small")!.textContent).toContain(
      "Java · BASICS"
    );
    expect((stored(doc) as { queueFocus: string }).queueFocus).toBe("java");

    rows()[0].click();
    expect(rows().map(row => row.dataset.qid)).toEqual([
      "java-2",
      "java-3",
      "java-4",
    ]);
    expect(text(byId(doc, "statProof"))).toBe("10");
  });

  it("shows an empty message when the focused track is fully verified", async () => {
    const completed: Record<string, boolean> = {};
    for (let index = 1; index <= 12; index++) completed[`java-${index}`] = true;
    const { doc } = await bootApp({
      preSeed: {
        "aster-study-dashboard-v3": JSON.stringify({
          completed,
          completedAt: {},
          activity: {},
          customTasks: [],
          resources: [],
          focus: { days: {}, sessions: [] },
        }),
      },
    });
    const select = doc.getElementById("queueFocus") as HTMLSelectElement;
    select.value = "java";
    select.dispatchEvent(
      new doc.defaultView!.Event("change", { bubbles: true })
    );

    expect(doc.querySelectorAll("#missionQueue .queue-row").length).toBe(0);
    const empty = doc.querySelector("#missionQueue .queue-empty");
    expect(empty?.textContent).toContain("fully verified");
  });
});

describe("keyboard shortcuts", () => {
  const key = (doc: Document, keyName: string, target?: Element) =>
    (target || doc.body).dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: keyName,
        bubbles: true,
        cancelable: true,
      })
    );
  const cursor = (doc: Document) =>
    doc.querySelector<HTMLElement>("#checkpoints .task-row.key-cursor");

  it("slash focuses the search box", async () => {
    const { doc } = await bootApp();
    const search = byId(doc, "search") as HTMLInputElement;
    key(doc, "/");
    expect(doc.activeElement).toBe(search);
  });

  it("j walks down the checkpoints, opening the owning tile and collapsing the previous", async () => {
    const { doc } = await bootApp();
    key(doc, "j");
    expect(cursor(doc)?.dataset.taskId).toBe("python-1");
    expect(doc.getElementById("python")!.classList.contains("open")).toBe(true);

    // python has 12 rows; the 12th j steps into 30 Days of Python.
    for (let index = 0; index < 11; index++) key(doc, "j");
    expect(cursor(doc)?.dataset.taskId).toBe("python-12");
    key(doc, "j");
    expect(cursor(doc)?.dataset.taskId).toBe("python30-1");
    expect(doc.getElementById("python30")!.classList.contains("open")).toBe(
      true
    );
    expect(doc.getElementById("python")!.classList.contains("open")).toBe(
      false
    );
  });

  it("k starts at the last row and steps up; the ends clamp", async () => {
    const { doc } = await bootApp();
    key(doc, "k");
    expect(cursor(doc)?.dataset.taskId).toBe("campusops-8");
    expect(doc.getElementById("campusops")!.classList.contains("open")).toBe(
      true
    );
    key(doc, "k");
    expect(cursor(doc)?.dataset.taskId).toBe("campusops-7");
    key(doc, "j");
    expect(cursor(doc)?.dataset.taskId).toBe("campusops-8");
  });

  it("space toggles the cursor row and the cursor survives the re-render", async () => {
    const { doc } = await bootApp();
    key(doc, "j");
    key(doc, " ");
    expect(text(byId(doc, "workbenchCount"))).toBe("1 completed");
    expect(text(byId(doc, "statProof"))).toBe("10");
    expect(cursor(doc)?.dataset.taskId).toBe("python-1");
    expect(cursor(doc)!.classList.contains("done")).toBe(true);
    expect(doc.getElementById("python")!.classList.contains("open")).toBe(
      true
    );
  });

  it("ignores shortcuts while typing in the search box", async () => {
    const { doc } = await bootApp();
    const search = byId(doc, "search") as HTMLInputElement;
    search.focus();
    key(doc, "j", search);
    key(doc, "k", search);
    expect(cursor(doc)).toBeNull();
    expect(doc.querySelectorAll(".track-card.open").length).toBe(0);
    expect(text(byId(doc, "workbenchCount"))).toBe("0 completed");
  });

  it("t starts and pauses the focus timer", async () => {
    const { doc } = await bootApp();
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    key(doc, "t");
    expect(text(byId(doc, "toast"))).toBe("Focus timer running.");
    key(doc, "t");
    expect(text(byId(doc, "toast"))).toBe("Focus timer paused.");
    vi.useRealTimers();
  });
});

describe("focus journal", () => {
  const runMinute = (doc: Document, stop: "pause" | "reset") => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    (doc.getElementById("timerStart") as HTMLButtonElement).click();
    vi.advanceTimersByTime(60_000);
    (doc.getElementById(`timer${stop === "pause" ? "Pause" : "Reset"}`) as HTMLButtonElement).click();
    vi.useRealTimers();
  };

  it("prompts on stop; saving writes the note and track onto the session, the weekly note, and the calendar story", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();
    runMinute(doc, "pause");

    const overlay = byId(doc, "journalOverlay")!;
    expect(overlay.hasAttribute("hidden")).toBe(false);
    expect(text(byId(doc, "journalTitle"))).toContain("1m of focus");

    (byId(doc, "journalNote") as HTMLInputElement).value =
      "Review Java interfaces";
    (byId(doc, "journalTrack") as HTMLSelectElement).value = "java";
    byId(doc, "journalNote")!.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      })
    );

    expect(overlay.hasAttribute("hidden")).toBe(true);
    const focus = stored(doc)!.focus as {
      sessions: Array<Record<string, unknown>>;
    };
    expect(focus.sessions).toEqual([
      { date: today, minutes: 1, track: "java", note: "Review Java interfaces" },
    ]);
    expect(text(byId(doc, "weeklyFocusNote"))).toBe(
      "1m focused this week. · Java 1m"
    );
  });

  it("journaled days tell their story on the calendar tooltip", async () => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const sunday = new Date();
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const sundayKey = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
    const { doc } = await bootApp({
      preSeed: {
        "aster-study-dashboard-v3": JSON.stringify({
          completed: {},
          completedAt: {},
          activity: {},
          customTasks: [],
          resources: [],
          focus: {
            days: {},
            sessions: [
              {
                date: sundayKey,
                minutes: 25,
                track: "python",
                note: "Reviewed list patterns",
              },
            ],
          },
        }),
      },
    });
    const dots = [...doc.querySelectorAll<HTMLElement>("#activityCalendar i")];
    const dot = dots.find(element => element.title.startsWith(sundayKey + ":"));
    expect(dot).toBeTruthy();
    expect(dot?.title).toContain("25m focused");
    expect(dot?.title).toContain("Python: Reviewed list patterns");
  });

  it("Escape skips the prompt and leaves the plain untagged session", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();
    runMinute(doc, "reset");

    expect(byId(doc, "journalOverlay")!.hasAttribute("hidden")).toBe(false);
    byId(doc, "journalOverlay")!.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(byId(doc, "journalOverlay")!.hasAttribute("hidden")).toBe(true);
    const focus = stored(doc)!.focus as {
      sessions: Array<Record<string, unknown>>;
    };
    expect(focus.sessions).toEqual([{ date: today, minutes: 1 }]);
    expect(text(byId(doc, "weeklyFocusNote"))).toBe(
      "1m focused this week."
    );
  });

  it("Solid and Redo drive the review queue", async () => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const shift = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };
    const { app, doc } = await bootApp({
      preSeed: {
        "aster-study-dashboard-v3": JSON.stringify({
          completed: { "python-1": true, "python-2": true },
          completedAt: { "python-1": shift(3), "python-2": shift(20) },
          activity: {},
          customTasks: [],
          resources: [],
          focus: { days: {}, sessions: [] },
        }),
      },
    });
    const today = (app as { todayKey(): string }).todayKey();
    const rows = () =>
      [...doc.querySelectorAll<HTMLElement>("#reviewQueue .review-row")];

    expect(text(byId(doc, "reviewCount"))).toBe("2 due");
    expect(rows()).toHaveLength(2);
    expect(rows()[0].querySelector("small")!.textContent).toContain(
      "due 3d after"
    );
    expect(rows()[0].querySelector("b")!.textContent).toContain(
      "Learn the basics"
    );

    // Solid on the first row records python-1@3 and drops it from the queue.
    rows()[0].querySelector<HTMLElement>("[data-review-solid]")!.click();
    expect(text(byId(doc, "reviewCount"))).toBe("1 due");
    expect(
      (stored(doc)!.reviews as Record<string, string>)["python-1@3"]
    ).toBe(today);
    expect(rows()[0].querySelector("b")!.textContent).toContain(
      "Control flow"
    );

    // Redo resets python-2 to today and clears its review history.
    rows()[0].querySelector<HTMLElement>("[data-review-redo]")!.click();
    expect(text(byId(doc, "reviewCount"))).toBe("Nothing due");
    expect(
      (stored(doc)!.completedAt as Record<string, string>)["python-2"]
    ).toBe(today);
    expect(stored(doc)!.reviews).toEqual({ "python-1@3": today });
    expect(byId(doc, "reviewEmpty")!.hasAttribute("hidden")).toBe(false);
  });

  it("opens the semester report overlay with live content and closes it", async () => {
    const { doc } = await bootApp();
    const overlay = byId(doc, "reportOverlay")!;
    expect(overlay.hasAttribute("hidden")).toBe(true);

    byId(doc, "reportOpen")!.click();
    expect(overlay.hasAttribute("hidden")).toBe(false);
    const frame = byId(doc, "reportFrame") as HTMLIFrameElement;
    const srcdoc = frame.getAttribute("srcdoc") || "";
    expect(srcdoc).toContain("Semester evidence report");
    expect(srcdoc).toContain(">0/12</strong>"); // python pulse on an empty state
    expect(srcdoc).toContain("Deep-work ledger");

    byId(doc, "reportClose")!.click();
    expect(overlay.hasAttribute("hidden")).toBe(true);
  });

  it("the Skip button closes the prompt without annotating", async () => {
    const { app, doc } = await bootApp();
    const today = (app as { todayKey(): string }).todayKey();
    runMinute(doc, "pause");
    byId(doc, "journalSkip")!.click();

    expect(byId(doc, "journalOverlay")!.hasAttribute("hidden")).toBe(true);
    const focus = stored(doc)!.focus as {
      sessions: Array<Record<string, unknown>>;
    };
    expect(focus.sessions).toEqual([{ date: today, minutes: 1 }]);
  });
});

const LB_CONFIG = {
  url: "https://supabase.example.co",
  anonKey: "anon-key-1",
  redirectUrl: "http://localhost:3000/study-dashboard.html",
};
const lbSleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A minimal signed-in boot against the injected fake Supabase client.
const bootSignedIn = async (fake: ReturnType<typeof makeFakeSupabase>) =>
  bootApp({
    supabaseConfig: LB_CONFIG,
    supabaseClientFactory: () => fake,
  });

describe("weekly leaderboard", () => {
  it("renders the board on sign-in and marks your own row", async () => {
    const fake = makeFakeSupabase({
      leaderboardRows: [
        { user_id: "user-1", display_name: "Sujay", points: 120 },
        { user_id: "user-2", display_name: "Priya", points: 90 },
        { user_id: "user-3", points: 40 },
      ],
    });
    const { doc } = await bootSignedIn(fake);
    await lbSleep(60);
    const block = byId(doc, "leaderboardBlock")!;
    expect(block.hasAttribute("hidden")).toBe(false);
    const list = text(byId(doc, "leaderboardList"))!;
    expect(list).toContain("Sujay");
    expect(list).toContain("120");
    expect(list).toContain("Priya");
    expect(list).toContain("Learner");
    expect(doc.querySelector(".lb-row.you span")?.textContent).toBe("Sujay");
    expect(text(byId(doc, "leaderboardMine"))).toBe("You · 120 pts · #1");
  });

  it("awards +10 when verifying a checkpoint and the board reflects it", async () => {
    const fake = makeFakeSupabase();
    const { doc } = await bootSignedIn(fake);
    await lbSleep(60);
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    await lbSleep(800);
    expect(fake.rpcCalls).toContainEqual(
      expect.objectContaining({
        name: "earn_points",
        args: expect.objectContaining({ p_amount: 10 }),
      })
    );
    expect(text(byId(doc, "leaderboardMine"))).toBe("You · 10 pts · #1");
  });

  it("subtracts 10 when unverifying a checkpoint", async () => {
    const fake = makeFakeSupabase({
      leaderboardRows: [
        { user_id: "user-1", display_name: "Sujay", points: 10 },
      ],
      // A returning user: their progress lives in the cloud row.
      existingState: {
        completed: { "python-1": true },
        completedAt: { "python-1": "2026-09-01" },
        activity: { "2026-09-01": 1 },
        customTasks: [],
        resources: [],
        focus: { days: {}, sessions: [] },
      },
    });
    const { doc } = await bootSignedIn(fake);
    await lbSleep(60);
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-1"] .check'
      )!
      .click();
    await lbSleep(800);
    expect(fake.rpcCalls).toContainEqual(
      expect.objectContaining({
        name: "earn_points",
        args: expect.objectContaining({ p_amount: -10 }),
      })
    );
  });

  it("awards a point per focus minute when a session is recorded", async () => {
    const fake = makeFakeSupabase();
    const { doc } = await bootSignedIn(fake);
    await lbSleep(60);
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    (doc.getElementById("timerStart") as HTMLButtonElement).click();
    vi.advanceTimersByTime(60_000);
    (doc.getElementById("timerPause") as HTMLButtonElement).click();
    vi.useRealTimers();
    await lbSleep(120);
    expect(fake.rpcCalls).toContainEqual(
      expect.objectContaining({
        args: expect.objectContaining({ p_amount: 1 }),
      })
    );
  });

  it("hides the board entirely when signed out", async () => {
    const { doc } = await bootApp();
    expect(byId(doc, "leaderboardBlock")!.hasAttribute("hidden")).toBe(true);
  });

  it("saving a nickname persists it and syncs the display name", async () => {
    const fake = makeFakeSupabase();
    const { doc } = await bootSignedIn(fake);
    await lbSleep(60);
    const input = byId(doc, "leaderboardName") as HTMLInputElement;
    input.value = "Ace";
    byId(doc, "leaderboardNameSave")!.click();
    await lbSleep(120);
    expect(
      (stored(doc, "user-1") as Record<string, unknown>).leaderboardName
    ).toBe("Ace");
    expect(fake.rpcCalls).toContainEqual(
      expect.objectContaining({
        name: "earn_points",
        args: expect.objectContaining({ p_display_name: "Ace", p_amount: 0 }),
      })
    );
  });
});

const profileSeed = () => ({
  completed: {
    "python-1": true,
    "python-2": true,
    "python-3": true,
    "python-4": true,
    "python30-1": true,
    "python30-2": true,
  },
  completedAt: { "python-1": "2026-09-01" },
  activity: {},
  customTasks: [],
  resources: [],
  focus: { days: {}, sessions: [] },
  profileName: "Riya",
  profileSemester: "Semester 3",
});

describe("profile card", () => {
  it("renders the editable name, semester, badges, metrics, and the pulse chart", async () => {
    const { doc } = await bootApp({
      preSeed: { [STORAGE_KEY]: JSON.stringify(profileSeed()) },
    });
    expect(
      text(byId(doc, "profileNameRow")!.querySelector(".profile-name")!)
    ).toBe("Riya");
    expect(text(byId(doc, "profileSemesterText"))).toBe("Semester 3");
    expect(text(byId(doc, "profileAvatar"))).toBe("R");
    expect(text(byId(doc, "welcomeHeadline"))).toContain("Riya");
    const badges = [
      ...doc.querySelectorAll("#profileBadges .profile-badge"),
    ].map(badge => badge.textContent?.trim());
    // Only tracks with verified checkpoints appear — no fabricated skills.
    expect(badges).toEqual(["Python", "30 Days of Python"]);
    expect(text(byId(doc, "profileBio"))).toContain(
      "6 of 76 checkpoints verified"
    );
    const metrics = text(byId(doc, "profileMetrics"))!;
    expect(metrics).toContain("6/76");
    expect(metrics).toContain("0d");
    expect(metrics).toContain("0m");
    expect(metrics).toContain("60 pts");
    const chart = byId(doc, "pulseChart")!.innerHTML;
    expect(chart).toContain("<svg");
    expect(chart).toContain("W5");
    expect(chart).toContain("polyline");
    expect(text(byId(doc, "focusCount"))).toBe("4 / 12");
  });

  it("edits the semester inline and persists it", async () => {
    const { doc } = await bootApp();
    byId(doc, "profileRole")!
      .querySelector<HTMLElement>("[data-edit-semester]")!
      .click();
    const input = doc.querySelector<HTMLInputElement>(
      ".profile-semester-input"
    )!;
    input.value = "Semester 5";
    input.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(text(byId(doc, "profileSemesterText"))).toBe("Semester 5");
    expect((stored(doc) as Record<string, unknown>).profileSemester).toBe(
      "Semester 5"
    );
  });

  it("refreshes the profile metrics when a checkpoint is toggled", async () => {
    const { doc } = await bootApp({
      preSeed: { [STORAGE_KEY]: JSON.stringify(profileSeed()) },
    });
    expect(text(byId(doc, "profileMetrics"))).toContain("60 pts");
    doc
      .querySelector<HTMLInputElement>(
        '.task-row[data-task-id="python-5"] .check'
      )!
      .click();
    expect(text(byId(doc, "profileMetrics"))).toContain("70 pts");
    expect(text(byId(doc, "profileBio"))).toContain("7 of 76");
  });

  it("opens the share overlay with the exported card SVG and closes it", async () => {
    const { doc } = await bootApp({
      preSeed: { [STORAGE_KEY]: JSON.stringify(profileSeed()) },
    });
    const overlay = byId(doc, "shareOverlay")!;
    expect(overlay.hasAttribute("hidden")).toBe(true);
    byId(doc, "shareProfile")!.click();
    expect(overlay.hasAttribute("hidden")).toBe(false);
    const svg = byId(doc, "sharePreview")!.innerHTML;
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("SEM ASSIST");
    expect(svg).toContain("Riya");
    expect(svg).toContain("Semester 3");
    byId(doc, "shareClose")!.click();
    expect(overlay.hasAttribute("hidden")).toBe(true);
  });

  it("starts fully neutral for fresh visitors with a [yourname] placeholder, then personalizes", async () => {
    const { app, doc } = await bootApp();
    const nameEl = byId(doc, "profileNameRow")!.querySelector(".profile-name")!;
    expect(text(nameEl)).toBe("[yourname]");
    expect(nameEl.classList.contains("placeholder")).toBe(true);
    // The greeting carries the bracketed placeholder beside the welcome text.
    const headline = byId(doc, "welcomeHeadline")!;
    expect(text(headline)).toContain("Welcome in, [yourname].");
    const headlineName = headline.querySelector(".welcome-name.placeholder")!;
    expect(headlineName).toBeTruthy();
    // Clicking the headline placeholder opens the name editor too.
    (headlineName as HTMLElement).click();
    expect(doc.querySelector<HTMLInputElement>(".profile-name-input")!).toBeTruthy();
    // No fabricated skills or stats: badges show an honest placeholder.
    const badges = [
      ...doc.querySelectorAll("#profileBadges .profile-badge"),
    ].map(badge => badge.textContent?.trim());
    expect(badges).toEqual([
      "Your top skills appear as you verify checkpoints",
    ]);
    expect(text(byId(doc, "introNote"))).not.toContain("lead");    // The share card is neutral too.
    const svg = (app as { buildProfileCardSvg(state: object): string }).buildProfileCardSvg(
      (app as { loadState(): object }).loadState()
    );
    expect(svg).toContain("[yourname]");
    expect(svg).not.toContain("Semester 3");
    expect(svg).not.toContain("Riya");
  });

  it("edits the name inline, updates the greeting and avatar, and persists it", async () => {
    const { doc } = await bootApp();
    byId(doc, "profileNameRow")!
      .querySelector<HTMLElement>("[data-edit-name]")!
      .click();
    const input = doc.querySelector<HTMLInputElement>(".profile-name-input")!;
    input.value = "Aarav";
    input.dispatchEvent(
      new doc.defaultView!.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(
      text(byId(doc, "profileNameRow")!.querySelector(".profile-name")!)
    ).toBe("Aarav");
    expect(text(byId(doc, "profileAvatar"))).toBe("A");
    expect(text(byId(doc, "welcomeHeadline"))).toContain("Aarav");
    expect((stored(doc) as Record<string, unknown>).profileName).toBe("Aarav");
  });
});
