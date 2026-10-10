# AGENTS.md — SEM ASSIST (jain-study-dashboard)

## Project overview

SEM ASSIST is a semester **study dashboard**: six learning tracks (76 checkpoints),
personal tasks, a deep-work timer with journaling, spaced-repetition review, an
activity calendar, a weekly leaderboard, a shareable profile card, a resource
canvas, and a print-ready semester report. The user-facing product is a
self-contained static page — no framework runtime on the page — that persists to
`localStorage` and optionally syncs per user to Supabase.

Production: https://semassist.runs-on.dev · Repository: https://github.com/SujayYadav776/SEMASSIST

## Technology stack

| Area | Verified choice |
| --- | --- |
| Product UI | Vanilla JS ES module + one HTML file (`client/public/study-dashboard.html`, `study-dashboard.js`) |
| Build | Vite 7 (`vite.config.ts`); esbuild bundles the production server |
| App shell | React 19 + TypeScript 5.6.3 + wouter + Radix/shadcn components + Tailwind 4 (redirects to the static page) |
| Server | Express 4 (`server/index.ts`) — static hosting, security headers, real 404 |
| Persistence | `localStorage` (per-user key) + optional Supabase Postgres sync |
| Auth | Supabase Auth (email/password) via `@supabase/supabase-js@2` loaded from `esm.sh` |
| Data | Supabase Postgres — `study_progress` (private), `weekly_points` (public board), `earn_points()` RPC |
| Tests | Vitest 2 + jsdom 30, driving the real dashboard HTML |
| Lint/format | ESLint 8 flat config (`eslint.config.js`), Prettier |
| Runtime / packages | Node 24 · `packageManager: pnpm@10.4.1` |
| Deploy | Vercel (`vercel.json`: `vite build` → `dist/public`) |

## Important commands

Run everything from the repository root.

| Command | Purpose | Status |
| --- | --- | --- |
| `npm run dev` | Vite dev server, port 3000 (auto-increments) | Executed |
| `npm test` | `vitest run` — 156 tests in 3 files | Executed (passing) |
| `npm run lint` | `eslint .` — 87 files | Executed (0 errors, 1 pre-existing warning in `vite.config.ts`) |
| `npm run build` | `vite build` → `dist/public`, server → `dist/index.js` | Declared |
| `npm run start` | `NODE_ENV=production node dist/index.js` (**POSIX-only**: uses a `NODE_ENV=` prefix) | Declared |
| `npm run check` | `tsc --noEmit` | **Currently fails** in `client/src/**` (pre-existing, see below) |
| `npm run hooks:install` | Installs the auto-push post-commit hook in a fresh clone | Declared |
| `npm run smtp:configure` | Supabase custom-SMTP configurator (dry run by default) | Executed |

Package-manager note: **`pnpm` is not on PATH in every environment here** — `npm run …`
works identically for the scripts above. For installs, keep the pnpm lockfile:
`npx --yes pnpm@10.4.1 install`. Dependencies are already installed in this checkout.

## Repository structure

```text
client/public/      the product (HTML + JS + Supabase config + theme + 404)
client/src/         React shell: routes "/" straight to /study-dashboard.html
server/index.ts     Express static host + security headers + 404 page
supabase/           schema.sql (tables, RLS, earn_points) + branded email templates
tests/              Vitest suites (unit, jsdom DOM, cloud) + shared harness
scripts/            auto-push hook + installer + configure-auth-smtp.mjs
drizzle/            tracked scaffolding; not imported anywhere — treat as unused
.ai/ docs/          agent memory (see below)
```

## Development rules

1. **Edit the static dashboard for product features.** `client/public/study-dashboard.html`
   and `study-dashboard.js` are the product. `client/src/**` is a redirect shell;
   `client/src/pages/Home.tsx` only replaces the location.
2. **Keep `study-dashboard.js`'s trailing `export { … }` list in sync.** The test
   suites import named symbols from it.
3. **Never put a Supabase `service_role` key in the client or the repo.** The
   publishable key in `client/public/supabase-config.js` is browser-safe only
   because of the RLS policies in `supabase/schema.sql`.
4. **Dates use `dateKey()` / `todayKey()`** (local-date keys). Do not reintroduce
   `toISOString().slice(0, 10)`: it caused date shifts outside UTC.
5. **`onAuthStateChange` handlers must stay synchronous** and must not call Supabase
   inside the callback — supabase-js holds its auth lock while dispatching and the
   client deadlocks. Defer with `setTimeout(…, 0)` and pin the deferred work to the
   document it was queued for. `tests/dashboard-unit.test.ts` enforces this.
6. **`showSignedInChrome(user)` is the single place** that toggles signed-in
   visibility (auth screen, sign-out button, profile security row).
7. **Preserve existing conventions and line endings.** `client/public/study-dashboard.html`
   uses CRLF; keep it that way.
8. **Verify with `npm test` and `npm run lint`.** Lint has one known pre-existing
   warning; do not silence new failures with suppressions.
9. **Do not commit or push unless asked.** A `post-commit` hook auto-pushes `main`
   to `origin` (bypass with `GIT_AUTOPUSH_OFF=1` for one commit). The working tree
   often contains another work stream's edits in `client/src/**` — leave them alone.
10. **`npm run check` (tsc) is red** in `client/src/**` (ManusDialog, `ui/carousel`,
    `ui/sidebar`, `hooks/useComposition`). It is deliberately not wired into CI.

## Context efficiency — startup protocol

Read this file first, plus any nested `AGENTS.md` before editing in its scope. Then
load only what the task needs:

| Work | Read next |
| --- | --- |
| New task | [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) (overview + boundaries), then the matching row of [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md) |
| Continue or take over | [.ai/CURRENT_TASK.md](.ai/CURRENT_TASK.md) → [.ai/HANDOFF.md](.ai/HANDOFF.md) → relevant map section |
| Architectural change | [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) → [.ai/DECISIONS.md](.ai/DECISIONS.md) → map |
| Small local edit | The relevant [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md) row, then the source |

Before acting, check `git status --short --branch` and verify task-critical claims
against source. Search for the symbol before opening the file. Do not load every
memory file. When memory lacks an answer, widen the investigation rather than
guessing.

**Update obligation:** when a task changes progress, blockers, or the next action,
update [.ai/CURRENT_TASK.md](.ai/CURRENT_TASK.md). On a substantial handoff, update
[.ai/HANDOFF.md](.ai/HANDOFF.md). Change architecture, decisions, or entry points
only when the code did.

Update [tasks.md](tasks.md) after every completed checkpoint and at the end of every
work session. Check off only verified work; record validation, blockers, and the
next action in its session log, and keep `.ai/CURRENT_TASK.md` aligned. The
checklist records planned work and does not itself authorize implementation.

## Source of truth

- **Implemented behavior:** the source and configuration in this repository.
- **Product behavior, setup, and auth wiring rationale:** [continue.md](continue.md)
  — the canonical, detailed handoff for this project. Memory files link to it
  rather than restating it.
- **Task state and handoff:** `.ai/CURRENT_TASK.md`, `.ai/HANDOFF.md`.
- **Code review findings and open issues:** [PROJECT-REVIEW.md](PROJECT-REVIEW.md),
  [todo.md](todo.md).
- **Design intent:** [ideas.md](ideas.md), [roadmap-source-notes.md](roadmap-source-notes.md).
- **Local run instructions:** [.freebuff/run.md](.freebuff/run.md).
