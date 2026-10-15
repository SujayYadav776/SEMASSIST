import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { bootApp, byId, stored } from "./helpers";
const script = (name: string) => readFileSync(new URL(`../client/public/${name}.js`, import.meta.url), "utf8");

it("opens bottom-sidebar Settings, saves font roles and theme mode, and restores them after reload", async () => {
  const { doc, win, app } = await bootApp({ runInit: false, url: "http://localhost:3000/study-dashboard.html?demo=1" });
  (win as any).eval(script("theme")); (win as any).eval(script("appearance"));
  await app.init();
  byId(doc, "settings")!.scrollIntoView = vi.fn();
  doc.querySelector<HTMLButtonElement>(".sidebar-foot [data-scroll=settings]")!.click();
  expect(byId(doc, "settings")!.hidden).toBe(false);
  expect(byId(doc, "calendar")!.hidden).toBe(true);
  expect(doc.querySelector(".sidebar-settings")!.getAttribute("aria-current")).toBe("page");
  const set = (id: string, value: string) => { const select = byId(doc, id) as HTMLSelectElement; select.value = value; select.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true })); };
  set("settingsThemeMode", "dark");
  expect(doc.documentElement.dataset.theme).toBe("dark");
  set("settingsFont-headings", "Space Grotesk"); set("settingsFont-numbers", "DM Sans");
  expect(doc.documentElement.style.getPropertyValue("--app-heading-font")).toBe('"Space Grotesk", sans-serif');
  expect(doc.documentElement.style.getPropertyValue("--app-number-font")).toBe('"DM Sans", sans-serif');
  const fonts = doc.defaultView!.localStorage.getItem("sem-assist-fonts")!;
  expect(JSON.parse(fonts)).toEqual({ body: "DM Sans", headings: "Space Grotesk", numbers: "DM Sans" });
  expect((app.loadState() as any).completed).toEqual({});
  expect(stored(doc)).toBeNull();
  const reload = await bootApp({ runInit: false, url: "http://localhost:3000/study-dashboard.html?demo=1&page=settings", preSeed: { "sem-assist-fonts": fonts, "sem-assist-theme": "dark" } });
  (reload.win as any).eval(script("theme")); (reload.win as any).eval(script("appearance")); await reload.app.init();
  expect((byId(reload.doc, "settingsFont-headings") as HTMLSelectElement).value).toBe("Space Grotesk");
  expect((byId(reload.doc, "settingsThemeMode") as HTMLSelectElement).value).toBe("dark");
  byId(reload.doc, "settingsResetFonts")!.click();
  expect(JSON.parse(reload.doc.defaultView!.localStorage.getItem("sem-assist-fonts")!)).toEqual({ body: "DM Sans", headings: "Heming", numbers: "Heming" });
});

it("follows system theme, rejects unknown fonts, synchronizes storage changes and applies preferences when storage is blocked", async () => {
  const { doc, win, app } = await bootApp({ runInit: false, url: "http://localhost:3000/study-dashboard.html?demo=1&page=settings" });
  let osChange: ((event: { matches: boolean }) => void) | undefined;
  (win as any).matchMedia = () => ({ matches: false, addEventListener: (_type: string, listener: typeof osChange) => { osChange = listener; } });
  (win as any).eval(script("theme")); (win as any).eval(script("appearance")); await app.init();
  const theme = (win as any).SemAssistTheme, fonts = (win as any).SemAssistAppearance;
  theme.setPreference("dark"); theme.setPreference("system");
  expect(doc.defaultView!.localStorage.getItem("sem-assist-theme")).toBeNull();
  osChange!({ matches: true }); expect(doc.documentElement.dataset.theme).toBe("dark");
  expect((byId(doc, "settingsThemeMode") as HTMLSelectElement).value).toBe("system");
  expect(fonts.setFont("headings", "url(evil)")).toBe(false);
  doc.defaultView!.localStorage.setItem("sem-assist-fonts", JSON.stringify({ body: "Space Grotesk", headings: "Unknown", numbers: "DM Sans" }));
  doc.defaultView!.dispatchEvent(new doc.defaultView!.StorageEvent("storage", { key: "sem-assist-fonts" }));
  expect(fonts.getFonts()).toEqual({ body: "Space Grotesk", headings: "Heming", numbers: "DM Sans" });
  expect((byId(doc, "settingsFont-body") as HTMLSelectElement).value).toBe("Space Grotesk");
  const spy = vi.spyOn(doc.defaultView!.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
  try {
    const input = byId(doc, "settingsFont-body") as HTMLSelectElement;
    input.value = "Heming"; input.dispatchEvent(new doc.defaultView!.Event("change", { bubbles: true }));
    expect(doc.documentElement.style.getPropertyValue("--app-body-font")).toBe('"Heming", sans-serif');
    expect(byId(doc, "settingsAppearanceStatus")!.textContent).toContain("Applied for this visit");
  } finally { spy.mockRestore(); }
});

it("offers six readable palettes, applies both modes, persists selection and follows palette changes across documents", async () => {
  const { doc, win, app } = await bootApp({ runInit: false, url: "http://localhost:3000/study-dashboard.html?demo=1&page=settings" });
  (win as any).eval(script("theme")); (win as any).eval(script("appearance")); await app.init();
  const api = (win as any).SemAssistAppearance;
  const luminance = (color: string) => {
    const rgb = color.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  expect(doc.querySelectorAll("[data-palette-choice]")).toHaveLength(6);
  for (const mode of ["light", "dark"]) {
    (win as any).SemAssistTheme.setPreference(mode);
    for (const palette of api.getPalettes()) {
      doc.querySelector<HTMLButtonElement>(`[data-palette-choice=${palette.id}]`)!.click();
      expect(doc.documentElement.dataset.palette).toBe(palette.id);
      expect(doc.documentElement.dataset.theme).toBe(mode);
      expect(doc.documentElement.style.getPropertyValue("--app-paper")).toBe(palette.colors.paper);
      expect(doc.querySelectorAll('[data-palette-choice][aria-pressed="true"]')).toHaveLength(1);
      expect(contrast(palette.colors.ink, palette.colors.card), `${palette.id} ${mode} body`).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.colors.muted, palette.colors.card), `${palette.id} ${mode} muted`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.colors.muted, palette.colors.paper), `${palette.id} ${mode} muted on paper`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(doc.documentElement.style.getPropertyValue("--app-sidebar-ink"), palette.colors.sidebar), `${palette.id} ${mode} sidebar`).toBeGreaterThanOrEqual(4.5);
    }
  }
  const reload = await bootApp({ runInit: false, url: "http://localhost:3000/study-dashboard.html?demo=1&page=settings", preSeed: { "sem-assist-palette": "plum", "sem-assist-theme": "dark" } });
  (reload.win as any).eval(script("theme")); (reload.win as any).eval(script("appearance")); await reload.app.init();
  expect(reload.doc.documentElement.dataset.palette).toBe("plum");
  expect(reload.doc.querySelector('[data-palette-choice=plum]')!.getAttribute("aria-pressed")).toBe("true");
  reload.doc.defaultView!.localStorage.setItem("sem-assist-palette", "slate");
  reload.doc.defaultView!.dispatchEvent(new reload.doc.defaultView!.StorageEvent("storage", { key: "sem-assist-palette" }));
  expect(reload.doc.documentElement.dataset.palette).toBe("slate");
  expect((reload.win as any).SemAssistAppearance.setPalette("unknown")).toBe(false);
  expect(reload.doc.documentElement.dataset.palette).toBe("slate");
  expect(stored(reload.doc)).toBeNull();
});
