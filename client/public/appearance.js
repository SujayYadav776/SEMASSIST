// Device preferences shared by the dashboard and its same-origin workspace frame.
(function () {
  "use strict";
  var key = "sem-assist-fonts";
  var defaults = { body: "DM Sans", headings: "Heming", numbers: "Heming" };
  var choices = ["DM Sans", "Heming", "Space Grotesk"];
  var fonts;
  var paletteKey = "sem-assist-palette";
  var paletteId = "paper";
  // Paper, card, surface, stronger surface, ink, muted ink, border, accent, soft accent, wash, sidebar.
  var colorKeys = ["paper", "card", "surface", "surface-strong", "ink", "muted", "line", "accent", "accent-soft", "accent-wash", "sidebar"];
  function palette(id, name, description, light, dark) {
    function tokens(values) { var result = {}; colorKeys.forEach(function (key, index) { result[key] = values[index]; }); return result; }
    return { id: id, name: name, description: description, light: tokens(light), dark: tokens(dark) };
  }
  var palettes = [
    palette("paper", "Paper & charcoal", "The original warm archive", ["#e8e2d2", "#ece6d8", "#eee9dc", "#e2dccd", "#282a24", "#656558", "#b8b29f", "#87926e", "#d4dac1", "#e1e5d4", "#20231e"], ["#252820", "#2c3027", "#30352b", "#3b4234", "#e7e4d8", "#b9beac", "#616754", "#a8b58b", "#47533a", "#343d2d", "#20231e"]),
    palette("sage", "Sage archive", "Soft greens and forest ink", ["#e6e9dd", "#edf0e5", "#e9edde", "#dce3d2", "#273126", "#596650", "#b1bda5", "#6f8468", "#c9d8be", "#dce5d3", "#252d24"], ["#232c23", "#2b352b", "#303b30", "#3b4938", "#e4eada", "#b3c0a8", "#5e7258", "#9eb68d", "#42573c", "#334530", "#1d251e"]),
    palette("slate", "Slate studio", "Cool paper and blue gray", ["#e2e6e8", "#eaf0f1", "#e8edef", "#d6dfe3", "#28333b", "#556470", "#a9b9c2", "#748995", "#c6d5dd", "#d8e3e8", "#252c32"], ["#232c33", "#2c363e", "#303d46", "#3b4b56", "#e0e9ed", "#aebfc9", "#5d7280", "#99b1c1", "#40586b", "#314553", "#1d252c"]),
    palette("sand", "Sand notebook", "Parchment and quiet bronze", ["#eee3d1", "#f3eadc", "#efe6d8", "#e3d6c2", "#382e24", "#70604b", "#bfae92", "#a08058", "#dfcaa9", "#e9dcc6", "#332c24"], ["#302820", "#393127", "#40372b", "#4e4232", "#ede2ce", "#c7b79a", "#7b684e", "#c2a374", "#655038", "#493b2a", "#27221c"]),
    palette("rose", "Rose ledger", "Dusty rose and cocoa ink", ["#ede1df", "#f2e8e5", "#efe5e2", "#e4d4d0", "#392b2d", "#70585d", "#c2aaaa", "#a2767d", "#e1c6cb", "#ead8dc", "#34282a"], ["#302629", "#3a2e32", "#413337", "#4f3d43", "#efe0de", "#cbb1b5", "#806068", "#c299a2", "#66434f", "#4b323c", "#292124"]),
    palette("plum", "Plum archive", "Muted lavender and aubergine", ["#e8e1e9", "#efe8ef", "#ece5ee", "#ddd2e1", "#332b38", "#6c5d75", "#b7a8bf", "#8c7796", "#d4c5de", "#e2d7e7", "#2e2632"], ["#2b2530", "#342d3b", "#3b3244", "#493c53", "#e9e0ee", "#beb0ca", "#756180", "#b29bc5", "#5a436b", "#403149", "#231f28"])
  ];
  function readPalette() {
    try { var value = localStorage.getItem(paletteKey); return palettes.some(function (item) { return item.id === value; }) ? value : "paper"; }
    catch (error) { return "paper"; }
  }
  function applyPalette(id) {
    var chosen = palettes.find(function (item) { return item.id === id; }) || palettes[0];
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var colors = chosen[dark ? "dark" : "light"];
    paletteId = chosen.id;
    document.documentElement.setAttribute("data-palette", paletteId);
    Object.keys(colors).forEach(function (name) { document.documentElement.style.setProperty("--app-" + name, colors[name]); });
    Object.keys(chosen.dark).forEach(function (name) { document.documentElement.style.setProperty("--app-dark-" + name, chosen.dark[name]); });
    document.documentElement.style.setProperty("--app-action", dark ? colors.ink : chosen.id === "paper" ? "#252820" : colors.sidebar);
    document.documentElement.style.setProperty("--app-action-ink", dark ? colors.paper : chosen.id === "paper" ? "#f1eee2" : colors.paper);
    document.documentElement.style.setProperty("--app-sidebar-ink", chosen.light.paper);
    document.documentElement.style.setProperty("--app-sidebar-hover", chosen.dark["surface-strong"]);
    document.documentElement.style.setProperty("--app-sidebar-line", chosen.dark.line);
    document.documentElement.style.setProperty("--app-nav-active-bg", dark ? colors.ink : colors.paper);
    document.documentElement.style.setProperty("--app-nav-active-ink", dark ? colors.paper : colors.sidebar);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) { meta.content = colors.paper; });
    document.dispatchEvent(new CustomEvent("semassist-palette-change"));
  }
  function normalize(value) {
    var next = {};
    Object.keys(defaults).forEach(function (role) { next[role] = value && choices.indexOf(value[role]) !== -1 ? value[role] : defaults[role]; });
    return next;
  }
  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch (error) { return normalize(null); }
  }
  function apply(value) {
    fonts = normalize(value);
    var properties = { body: "--app-body-font", headings: "--app-heading-font", numbers: "--app-number-font" };
    Object.keys(properties).forEach(function (role) { document.documentElement.style.setProperty(properties[role], '"' + fonts[role] + '", sans-serif'); });
    document.dispatchEvent(new CustomEvent("semassist-fonts-change"));
  }
  function save(value) {
    var next = normalize(value), saved = true;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (error) { saved = false; }
    apply(next);
    return saved;
  }
  window.SemAssistAppearance = {
    choices: choices.slice(),
    getFonts: function () { return Object.assign({}, fonts); },
    setFont: function (role, font) {
      if (!Object.prototype.hasOwnProperty.call(defaults, role) || choices.indexOf(font) === -1) return false;
      var next = Object.assign({}, fonts); next[role] = font;
      return save(next);
    },
    resetFonts: function () { return save(defaults); },
    getPalette: function () { return paletteId; },
    getPalettes: function () { return palettes.map(function (item) { return { id: item.id, name: item.name, description: item.description, colors: Object.assign({}, item[document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"]) }; }); },
    setPalette: function (id) {
      if (!palettes.some(function (item) { return item.id === id; })) return false;
      var saved = true;
      try { localStorage.setItem(paletteKey, id); } catch (error) { saved = false; }
      applyPalette(id); return saved;
    }
  };
  apply(read());
  applyPalette(readPalette());
  document.addEventListener("semassist-theme-change", function () { applyPalette(paletteId); });
  window.addEventListener("storage", function (event) {
    if (event.key === key || event.key === null) apply(read());
    if (event.key === paletteKey || event.key === null) applyPalette(readPalette());
  });
})();
