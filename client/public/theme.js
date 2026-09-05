// Shared theme module for SEM ASSIST pages (404 page and study dashboard).
// One localStorage key — "sem-assist-theme" — so the light/dark/auto choice
// made on either page applies to every page on the same origin.
// Modes: "light", "dark", or "auto" (follow the OS preference, live).
// The toggle cycles light → dark → auto → light; the glyph shows the NEXT
// state and the label names current + next.
// Runs in <head> before first paint (no theme flash). CSP-safe: same-origin
// external file, no inline script.
(function () {
  "use strict";

  var STORAGE_KEY = "sem-assist-theme";
  var LEGACY_KEY = "sem-assist-404-theme";
  var MODES = ["light", "dark", "auto"]; // click cycle: light → dark → auto
  var root = document.documentElement;
  var themeColorMetas = Array.prototype.slice.call(
    document.querySelectorAll('meta[name="theme-color"]')
  );
  var currentMode = "auto";

  function themeColorFor(theme) {
    return theme === "dark" ? "#23221f" : "#a9afba";
  }

  function osPrefersDark() {
    return !!(
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function resolveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return osPrefersDark() ? "dark" : "light";
  }

  function nextMode(mode) {
    return MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  }

  function modeLabel(mode) {
    switch (nextMode(mode)) {
      case "dark":
        return "Theme: light — switch to dark";
      case "auto":
        return "Theme: dark — switch to auto (follow system)";
      default:
        return "Theme: auto (follow system) — switch to light";
    }
  }

  function setThemeColor(theme) {
    themeColorMetas.forEach(function (meta) {
      meta.removeAttribute("media");
      meta.content = themeColorFor(theme);
    });
  }

  function updateToggleButton(mode) {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var label = modeLabel(mode);
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    var next = nextMode(mode);
    if (next === "auto") {
      // Auto state: CSS-drawn sun/moon icon (see the pages' stylesheets).
      btn.textContent = "";
      btn.setAttribute("data-theme-icon", "auto");
    } else {
      btn.textContent = next === "dark" ? "\u263E" : "\u2600"; // ☾ / ☀
      btn.removeAttribute("data-theme-icon");
    }
  }

  function applyTheme(mode) {
    currentMode = mode;
    var theme = resolveTheme(mode);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-mode", mode);
    setThemeColor(theme);
    updateToggleButton(mode);
  }

  function readPreference() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
      if (MODES.indexOf(saved) === -1) {
        // Migrate the old 404-only key (light/dark) if the shared one is unset.
        var legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy === "light" || legacy === "dark") {
          localStorage.setItem(STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_KEY);
          saved = legacy;
        }
      }
    } catch (e) {
      /* storage unavailable — fall through to auto */
    }
    return MODES.indexOf(saved) !== -1 ? saved : "auto";
  }

  applyTheme(readPreference());

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    // The button markup ships with a placeholder glyph; sync it now that it
    // exists so it reflects the resolved mode.
    updateToggleButton(currentMode);

    btn.addEventListener("click", function () {
      var next = nextMode(currentMode);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        /* storage unavailable — the choice still applies for this visit */
      }
      applyTheme(next);
    });
  });

  // Follow OS theme changes live while the mode is "auto".
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onOsChange = function () {
      if (currentMode !== "auto") return;
      applyTheme("auto"); // re-resolves against the new OS preference
    };
    if (mq.addEventListener) mq.addEventListener("change", onOsChange);
    else if (mq.addListener) mq.addListener(onOsChange);
  } catch (e) {
    /* matchMedia unavailable — ignore */
  }

  // Sync across open tabs/pages of the same origin: toggling on one page
  // updates the others immediately.
  window.addEventListener("storage", function (e) {
    if (e.key !== STORAGE_KEY) return;
    var v = e.newValue;
    applyTheme(MODES.indexOf(v) !== -1 ? v : "auto");
  });
})();