export function initWorkspaceSettings() {
  const doc = document;
  const byId = id => doc.getElementById(id);
  const appearance = window.SemAssistAppearance;
  const theme = window.SemAssistTheme;
  function sync() {
    if (theme) byId("settingsThemeMode").value = theme.getPreference();
    const fonts = appearance?.getFonts() || { body: "DM Sans", headings: "Heming", numbers: "Heming" };
    for (const role of ["body", "headings", "numbers"]) byId(`settingsFont-${role}`).value = fonts[role];
    for (const item of appearance?.getPalettes() || []) {
      const button = byId("settingsPaletteGrid").querySelector(`[data-palette-choice="${item.id}"]`);
      if (!button) continue;
      button.setAttribute("aria-pressed", String(appearance.getPalette() === item.id));
      const colors = [item.colors.sidebar, item.colors.paper, item.colors.card, item.colors.accent];
      button.querySelectorAll(".palette-preview i").forEach((swatch, index) => { swatch.style.backgroundColor = colors[index]; });
    }
  }
  function status(saved) { byId("settingsAppearanceStatus").textContent = saved ? "Appearance preferences saved in this browser." : "Applied for this visit. Browser storage is unavailable."; }
  byId("settingsThemeMode").addEventListener("change", event => {
    if (theme) status(theme.setPreference(event.target.value));
  });
  for (const role of ["body", "headings", "numbers"]) {
    const select = byId(`settingsFont-${role}`);
    for (const name of appearance?.choices || ["DM Sans", "Heming", "Space Grotesk"]) {
      const option = doc.createElement("option"); option.value = name; option.textContent = name; select.appendChild(option);
    }
    select.addEventListener("change", event => { if (appearance) status(appearance.setFont(role, event.target.value)); });
  }
  byId("settingsResetFonts").addEventListener("click", () => { if (appearance) status(appearance.resetFonts()); });
  for (const item of appearance?.getPalettes() || []) {
    const button = doc.createElement("button"); button.type = "button"; button.className = "palette-option"; button.dataset.paletteChoice = item.id;
    const preview = doc.createElement("span"); preview.className = "palette-preview"; preview.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 4; index++) preview.appendChild(doc.createElement("i"));
    const name = doc.createElement("strong"); name.textContent = item.name;
    const description = doc.createElement("small"); description.textContent = item.description;
    button.append(preview, name, description);
    button.addEventListener("click", () => status(appearance.setPalette(item.id)));
    byId("settingsPaletteGrid").appendChild(button);
  }
  doc.addEventListener("semassist-fonts-change", sync);
  doc.addEventListener("semassist-theme-change", sync);
  doc.addEventListener("semassist-palette-change", sync);
  sync();
}
