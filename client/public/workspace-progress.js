import { validCalendarDate } from "./workspace-calendar.js";

const finite = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export function buildSkillMetrics(state, tracks, roadmaps, taskId) {
  const groups = new Map();
  for (const track of [...tracks, ...roadmaps]) {
    const id = ["python", "python30"].includes(track.id) ? "python" : track.id;
    const name = id === "python" ? "Python" : track.name;
    const skill = groups.get(id) || { id, name, total: 0, done: 0, recalled: 0, sources: [], next: null };
    skill.sources.push({ id: track.id, name: track.name, roadmapId: track.roadmapId });
    track.tasks.forEach((task, index) => {
      const checkpoint = track.roadmapId ? task.sourceTaskId : taskId(track, index);
      const done = track.roadmapId ? Boolean(task.completed) : Boolean(state.completed[checkpoint]);
      skill.total++;
      if (done) {
        skill.done++;
        if (!track.roadmapId && [3, 7, 14].some(day => validCalendarDate(state.reviews?.[`${checkpoint}@${day}`]))) skill.recalled++;
      } else if (!skill.next) skill.next = { title: track.roadmapId ? task.label : task[0], track: track.id, roadmap: track.roadmapId, task: checkpoint };
    });
    groups.set(id, skill);
  }
  return [...groups.values()].map(skill => ({ ...skill, score: skill.total ? Math.round(skill.done / skill.total * 100) : null }));
}
export function progressSeries(state, today, count) {
  const date = new Date(`${today}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(date); day.setDate(day.getDate() - count + index + 1);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return { date: key, actions: finite(state.activity?.[key]), minutes: finite(state.focus?.days?.[key]) };
  });
}

export function initWorkspaceProgress(api) {
  const doc = document, byId = id => doc.getElementById(id), escape = api.escapeHtml;
  let period = 30;
  function gauge(score) {
    const marks = Array.from({ length: 40 }, (_, index) => {
      const angle = Math.PI + (index + .5) * Math.PI / 40;
      const x = radius => 150 + Math.cos(angle) * radius;
      const y = radius => 145 + Math.sin(angle) * radius;
      return `<line x1="${x(105)}" y1="${y(105)}" x2="${x(128)}" y2="${y(128)}" class="${index < Math.round(score / 100 * 40) ? "gauge-filled" : "gauge-empty"}" />`;
    }).join("");
    return `<svg viewBox="0 0 300 190" role="img" aria-label="Overall checkpoint progress ${score} out of 100"><title>${score}/100 checkpoint progress</title>${marks}<text x="150" y="132" text-anchor="middle" class="gauge-number">${score}</text><text x="150" y="159" text-anchor="middle">out of 100</text></svg>`;
  }
  function radar(skills, compact = false) {
    const selected = [...skills].filter(skill => skill.total).sort((a, b) => b.score - a.score).slice(0, 8);
    if (selected.length < 3) return '<p class="insights-empty">Add checkpoints to at least three learning paths to compare your skill profile.</p>';
    const point = (index, radius) => {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / selected.length;
      return [210 + Math.cos(angle) * radius, 170 + Math.sin(angle) * radius];
    };
    const polygon = radius => selected.map((_, index) => point(index, radius).join(",")).join(" ");
    const grid = [20, 40, 60, 80, 100].map(value => `<polygon points="${polygon(value)}" class="radar-grid" />`).join("");
    const axes = selected.map((skill, index) => {
      const [x, y] = point(index, 100), [labelX, labelY] = point(index, 135);
      const short = skill.name.length > 18 ? `${skill.name.slice(0, 16)}…` : skill.name;
      return `<line x1="210" y1="170" x2="${x}" y2="${y}" class="radar-grid" /><text x="${labelX}" y="${labelY}" text-anchor="middle"><tspan x="${labelX}">${escape(short)}</tspan><tspan x="${labelX}" dy="17" class="radar-score">${skill.score}/100</tspan></text>`;
    }).join("");
    const shape = selected.map((skill, index) => point(index, skill.score).join(",")).join(" ");
    return `<svg viewBox="0 0 420 340" role="img" aria-label="Skill scores: ${escape(selected.map(skill => `${skill.name} ${skill.score}/100`).join(", "))}"><title>Skill progress profile</title>${grid}${axes}<polygon points="${shape}" class="radar-fill" />${selected.map((skill, index) => { const [x, y] = point(index, skill.score); return `<circle cx="${x}" cy="${y}" r="3" class="radar-dot" />`; }).join("")}</svg><p class="insights-chart-note">${compact ? "Verified checkpoint coverage out of 100. Up to eight highest-progress skills." : "Up to eight highest-progress skills. Every skill is listed below."}</p>`;
  }
  function chart(series, field, label) {
    const width = 560, height = 200, left = 35, right = 10, top = 15, bottom = 35;
    const max = Math.max(1, ...series.map(day => day[field]));
    const x = index => left + index * (width - left - right) / Math.max(1, series.length - 1);
    const y = value => height - bottom - value / max * (height - bottom - top);
    const grid = [0, .5, 1].map(ratio => `<line x1="${left}" x2="${width - right}" y1="${y(max * ratio)}" y2="${y(max * ratio)}" class="chart-grid"/><text x="${left - 6}" y="${y(max * ratio) + 4}" text-anchor="end">${Math.round(max * ratio)}</text>`).join("");
    const marks = field === "actions"
      ? series.map((day, index) => `<rect x="${left + index * (width - left - right) / series.length}" y="${y(day.actions)}" width="${Math.max(1, (width - left - right) / series.length - 3)}" height="${height - bottom - y(day.actions)}" class="chart-bar"><title>${day.date}: ${day.actions} actions</title></rect>`).join("")
      : `<polygon points="${left},${height - bottom} ${series.map((day, index) => `${x(index)},${y(day.minutes)}`).join(" ")} ${width - right},${height - bottom}" class="chart-area"/><polyline points="${series.map((day, index) => `${x(index)},${y(day.minutes)}`).join(" ")}" class="chart-line"/>`;
    const ticks = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])].map(index => `<text x="${x(index)}" y="${height - 10}" text-anchor="${index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}">${escape(new Date(`${series[index].date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}</text>`).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label} over ${period} days"><title>${label}</title>${grid}${marks}${ticks}</svg>`;
  }
  function render() {
    const page = doc.body.dataset.workspacePage;
    if (page !== "progress" && page !== "overview") return;
    const state = api.loadState(), skills = buildSkillMetrics(state, api.tracks(), api.roadmaps(), api.taskId);
    if (page === "overview") { byId("homeSkillRadar").innerHTML = radar(skills, true); return; }
    const total = skills.reduce((sum, skill) => sum + skill.total, 0), done = skills.reduce((sum, skill) => sum + skill.done, 0);
    const score = total ? Math.round(done / total * 100) : 0;
    const series = progressSeries(state, api.todayKey(), period);
    const actions = series.reduce((sum, day) => sum + day.actions, 0), minutes = series.reduce((sum, day) => sum + day.minutes, 0);
    const recalled = skills.reduce((sum, skill) => sum + skill.recalled, 0);
    byId("insightsMetrics").innerHTML = [
      ["Verified checkpoints", `${done} / ${total}`, "Across tracks and active roadmaps"],
      ["Focus time", api.formatMinutes(minutes), `Last ${period} days`],
      ["Active days", String(series.filter(day => day.actions > 0 || day.minutes > 0).length), `Of the last ${period} days`],
      ["Recall evidence", String(recalled), "Checkpoints recalled in a Solid review"],
    ].map(([label, value, note]) => `<article class="insights-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
    byId("insightsGauge").innerHTML = gauge(score);
    byId("insightsGaugeNote").textContent = `${done} verified checkpoints. ${total - done} remaining.`;
    byId("insightsRadar").innerHTML = radar(skills);
    byId("insightsSkillCount").textContent = `${skills.length} skills`;
    byId("insightsSkills").innerHTML = skills.map(skill => `<article class="insights-skill"><div class="insights-skill-head"><h4>${escape(skill.name)}</h4><strong>${skill.score === null ? "—" : skill.score}<small>${skill.score === null ? "No checkpoints" : "/ 100"}</small></strong></div><div class="insights-meter" role="meter" aria-label="${escape(skill.name)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${skill.score || 0}"><span style="width:${skill.score || 0}%"></span></div><p>${skill.done}/${skill.total} verified${skill.recalled ? ` · ${skill.recalled} recalled` : ""}</p><small>${escape(skill.sources.map(source => source.name).join(" · "))}</small>${skill.next ? `<button type="button" class="mini-button" data-insights-skill="${escape(skill.id)}">Next: ${escape(skill.next.title)}</button>` : skill.total ? '<span class="insights-complete">All checkpoints verified</span>' : '<button type="button" class="mini-button" data-scroll="learning">Add checkpoints</button>'}</article>`).join("");
    byId("insightsActivityChart").innerHTML = chart(series, "actions", "Daily completed actions");
    byId("insightsFocusChart").innerHTML = chart(series, "minutes", "Daily focus minutes");
    byId("insightsActivityTotal").textContent = `${actions} completed actions`;
    byId("insightsFocusTotal").textContent = `${api.formatMinutes(minutes)} of focus`;
    const candidates = skills.filter(skill => skill.next).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
    byId("insightsNextSteps").innerHTML = candidates.map(skill => `<button type="button" class="insights-next" data-insights-skill="${escape(skill.id)}"><strong>${escape(skill.name)}</strong><span>${escape(skill.next.title)}</span></button>`).join("") || '<p class="insights-empty">All available checkpoints are verified. Add a learning path for your next goal.</p>';
  }
  byId("insightsPeriod").addEventListener("change", event => { const next = Number(event.target.value); if ([7, 30, 90].includes(next)) period = next; render(); });
  byId("progress").addEventListener("click", event => {
    const button = event.target.closest("[data-insights-skill]"); if (!button) return;
    const skill = buildSkillMetrics(api.loadState(), api.tracks(), api.roadmaps(), api.taskId).find(item => item.id === button.dataset.insightsSkill);
    if (skill?.next?.roadmap) api.openRoadmap(skill.next.roadmap, "overview", skill.next.task);
    else if (skill?.next) api.openSection(skill.next.track, skill.next.task);
  });
  render();
  return { render, reset: () => { period = 30; byId("insightsPeriod").value = "30"; } };
}
