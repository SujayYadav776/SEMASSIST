// Shared theme module for SEM ASSIST pages (404 page and study dashboard).
// One localStorage key — "sem-assist-theme" — so the light/dark choice made
// on either page applies to every page on the same origin. Follows the OS
// preference until the user toggles; the toggle pins an explicit choice.
// Runs in <head> before first paint (no theme flash). CSP-safe: same-origin
// external file, no inline script.
(function () {
  "use strict";

  var STORAGE_KEY = "sem-assist-theme";
  var LEGACY_KEY = "sem-assist-404-theme";
  var root = document.documentElement;
  var themeColorMetas = Array.prototype.slice.call(
    document.querySelectorAll('meta[name="theme-color"]')
  );

  function themeColorFor(theme) {
    return theme === "dark" ? "#23221f" : "#a9afba";
  }

  function setThemeColor(theme) {
    themeColorMetas.forEach(function (meta) {
      meta.removeAttribute("media");
      meta.content = themeColorFor(theme);
    });
  }

  function updateToggleButton(theme) {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var next = theme === "dark" ? "light" : "dark";
    btn.textContent = theme === "dark" ? "\u2600" : "\u263E"; // ☀ / ☾
    var label = "Switch to " + next + " theme";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    setThemeColor(theme);
    updateToggleButton(theme);
  }

  function readPreference() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== "light" && saved !== "dark") {
        // "auto" from the earlier three-state build counts as no preference.
        if (saved === "auto") {
          localStorage.removeItem(STORAGE_KEY);
          saved = null;
        }
        // Migrate the old 404-only key if the shared one was never set.
        var legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy === "light" || legacy === "dark") {
          localStorage.setItem(STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_KEY);
          saved = legacy;
        }
      }
    } catch (e) {
      /* storage unavailable — fall through to OS default */
    }
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function hasSavedPreference() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark";
    } catch (e) {
      return false;
    }
  }

  applyTheme(readPreference());

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    // The button markup ships with a default glyph; sync it now that it exists.
    updateToggleButton(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        /* storage unavailable — the choice still applies for this visit */
      }
      applyTheme(next);
    });
  });

  // Follow OS theme changes live, but only while no explicit choice is saved.
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onOsChange = function (e) {
      if (hasSavedPreference()) return;
      applyTheme(e.matches ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", onOsChange);
    else if (mq.addListener) mq.addListener(onOsChange);
  } catch (e) {
    /* matchMedia unavailable — ignore */
  }

  // Sync across open tabs/pages of the same origin: toggling on one page
  // updates the other immediately.
  window.addEventListener("storage", function (e) {
    if (e.key !== STORAGE_KEY) return;
    var v = e.newValue;
    if (v === "light" || v === "dark") applyTheme(v);
  });
})();