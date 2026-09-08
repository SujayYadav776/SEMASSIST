# SEM ASSIST

A calm, modular **semester study dashboard** that turns roadmap checkpoints into visible, verifiable evidence. Plan six learning tracks, check off checkpoints, log deep-focus sessions, and walk into placement conversations with a shareable profile card and a print-ready semester report.

Live demo: **https://semassist.runs-on.dev**

## What it does

SEM ASSIST is a self-contained static dashboard (a single HTML file plus a plain JavaScript module — no framework runtime on the page). Pick a learning path, work through its checkpoints, and the dashboard quietly keeps score: progress rings, an activity calendar, streaks, weekly rhythm, and proof points.

Six built-in tracks (76 checkpoints total):

| Track | Focus |
|---|---|
| Python | Foundation, tooling, quality, concurrency |
| 30 Days of Python | Hands-on daily challenge (Asabeneh) |
| Java | Language, OOP, collections, I/O, testing |
| OS / Linux | Processes, threads, memory, IPC, observability |
| Algorithms | Repeated practice in both primary languages |
| CampusOps | Flagship semester project evidence |

## Features

- **Checkpoint tracking** — tick roadmap checkpoints per track; completion drives progress, streaks, the activity calendar, and proof points.
- **Checkpoint queue** — a "today's mission" card that pulls the next unchecked checkpoints, with a per-track focus picker.
- **Collapsible track tiles** — click a track to expand its checklist; state is preserved.
- **Personal tasks** — custom tasks with a Today/This week cadence and optional due dates (overdue items highlight).
- **Deep work timer** — a focus timer that persists minutes into the activity calendar, weekly rhythm bars, and a focus journal.
- **Focus journaling** — when you stop the timer, note what you worked on and tag the track; sessions feed weekly totals and calendar stories.
- **Review mode** — lightweight spaced repetition: completed checkpoints re-surface at 3, 7, and 14 days as a Solid/Redo self-test.
- **Editable profile card** — name, semester, and stats in the SEM ASSIST visual language, with a **share button that exports a crisp PNG** card for placement-prep conversations.
- **Weekly leaderboard** — earn 10 pts per verified checkpoint and 1 pt per focus minute; the top of this week's board is public among signed-in users, nicknames optional.
- **Semester report** — a styled, print-to-PDF A4 evidence report (progress, streaks, deep-work ledger, reference shelf).
- **Resource canvas** — save links as draggable, keyboard-navigable cards on a snap-to-grid canvas.
- **Activity calendar** — GitHub-style 52-week heatmap of completions.
- **Keyboard shortcuts** — `j`/`k` move between checkpoints, `space` toggles, `/` searches, `t` starts the timer.
- **Light & dark themes** — a manual toggle that follows the SEM ASSIST palette.
- **On-brand 404 page** — a styled not-found route for anything that misses.

## Stack

| Layer | Choice |
|---|---|
| App | Static `client/public/study-dashboard.html` + `study-dashboard.js` (vanilla JS module, no build step on the page) |
| Build | Vite 7 (site shell), esbuild (production server bundle) |
| Server | Express (`server/index.ts`) — static hosting, security headers, SPA/404 handling |
| Persistence | Browser `localStorage` + optional Supabase cloud sync per user |
| Auth | Supabase Auth (email/password), RLS-protected per-user rows |
| Data | Supabase Postgres — `study_progress` (private) and `weekly_points` (public leaderboard) |
| Tests | Vitest (unit + jsdom DOM tests against the real HTML) |
| Deploy | Vercel (production) |

## Repository layout

```text
assets/
  social-preview.png       # 1280×640 GitHub social preview card (upload manually:
                           # Settings → General → Social preview)
client/
  public/
    study-dashboard.html     # the whole dashboard UI (markup + styles)
    study-dashboard.js       # all dashboard behavior
    supabase-config.js       # Supabase URL + publishable key + redirect
    404.html                 # on-brand not-found page
  src/                       # React shell that redirects to the dashboard
server/index.ts              # Express static server + security headers
supabase/schema.sql          # tables, RLS policies, earn_points() RPC
tests/                       # Vitest unit + DOM suites
scripts/                     # auto-push git hook installer
```

The product page is deliberately dependency-light: `study-dashboard.html` loads one
JS module and the Supabase client from `esm.sh`. The React app in `client/src/` is the
dev/build shell and simply routes to `/study-dashboard.html`.

## Getting started

Requires Node.js and `pnpm`.

```bash
pnpm install
pnpm dev          # vite dev server → http://localhost:3000
pnpm test         # 100+ unit + DOM tests
pnpm check        # TypeScript checks
pnpm build        # static site → dist/public, server → dist/index.js
pnpm start        # production server on PORT or 3000
```

No environment files are required — the Supabase publishable key is committed in
`client/public/supabase-config.js` by design (browser-safe, protected by RLS).

## Supabase setup (one time, project owner)

The dashboard works fully offline with `localStorage`. Cloud sync, per-user
progress, and the leaderboard need a Supabase project:

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**, paste the entire contents of
   `supabase/schema.sql`, and run it. This creates:
   - `study_progress` — per-user state, RLS: each user may read/write only their own row.
   - `weekly_points` — the leaderboard, RLS: readable by all signed-in users, writable
     only for your own row.
   - `earn_points(user_id, amount, display_name)` — a SECURITY DEFINER function that
     atomically adds points for the current week (Monday UTC) and refuses to touch
     anyone else's row.
3. In **Authentication → Providers**, enable **Email**.
4. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (dev) and `https://semassist.runs-on.dev/study-dashboard.html` (prod)
   - Redirect URL: the same origins' `/study-dashboard.html` paths.
5. Copy your project URL and **publishable (anon)** key into
   `client/public/supabase-config.js`:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://YOUR-PROJECT.supabase.co",
     anonKey: "sb_publishable_...", // or the legacy anon JWT
     redirectUrl: window.location.origin + "/study-dashboard.html",
   };
   ```

> Never put a `service_role` key in this file or anywhere in the client. The
> publishable key is safe for browsers only because of the RLS policies above.

Until the schema is applied, sign-ins work but cloud saves fail silently and the
leaderboard shows its empty state — that's expected.

## Deployment

The site is a static build plus a tiny Node server; both deploy to Vercel. The
`vercel.json` config sets `vite build` with output at `dist/public` and applies a
strict security-header set.

```bash
pnpm exec vercel --prod   # deploy to production from the linked project
```

Production alias: **https://semassist.runs-on.dev**

## Git workflow

`main` tracks `origin/main` at https://github.com/SujayYadav776/SEMASSIST. A local
post-commit hook auto-pushes after every commit to keep the contribution graph
current. Fresh clones:

```bash
pnpm hooks:install   # installs .git/hooks/post-commit from scripts/
```

Set `GIT_AUTOPUSH_OFF=1` to commit without pushing.

## Tests

The suite runs against the real dashboard file, so UI regressions are caught at the
DOM level:

- `tests/dashboard-unit.test.ts` — pure logic: stats, streaks, queue, review
  scheduling, SVG export builders, date keys.
- `tests/dashboard-dom.test.ts` — boots the actual HTML in jsdom and drives it:
  checkpoints, timer/journal, keyboard shortcuts, leaderboard, profile editing,
  share overlay.
- `tests/dashboard-cloud.test.ts` — Supabase session/save flow with a fake client.

## License

[MIT](LICENSE) © 2026 Sujay Yadav
