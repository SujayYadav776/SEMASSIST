# Codebase map — SEM ASSIST

Navigation index for agents. Read only the row you need. Canonical detail lives in
[continue.md](../continue.md) (product + setup) and [.ai/ARCHITECTURE.md](../.ai/ARCHITECTURE.md)
(boundaries and flows).

## Entry points

PRD contract entry: `packages/roadmap-schema/src/index.ts` exports package/entity
schemas, `packageJsonSchema`, `validatePackage`, `parsePackageJson`, and reversible
legacy staging helpers. CLI entry points are `scripts/validate-roadmap.ts` and
`scripts/prepare-legacy-migration.ts`; see `docs/ROADMAP_CONTRACT.md`, `examples`,
and `tests/roadmap-{schema,tools}.test.ts`. Current dashboard imports remain legacy.

| Entry | What it does |
| --- | --- |
| `client/index.html` | Vite HTML shell: meta refresh + `location.replace("/study-dashboard.html")` |
| `client/src/main.tsx` | React bootstrap (dev/build shell only) |
| `client/src/pages/Home.tsx` | Route `/` — immediately redirects to the static dashboard |
| `client/public/study-dashboard-boot.js` | Imports `init` and calls it; the module itself does not self-init |
| `client/public/study-dashboard.js` | All dashboard behavior; `init()` is the runtime entry |
| `server/index.ts` | Express static host + security headers + 404 (production) |
| `scripts/configure-auth-smtp.mjs` | Owner-side Supabase custom-SMTP configurator (CLI) |
| `scripts/post-commit`, `scripts/install-autopush-hook.sh` | Auto-push hook and its installer |

## Directory map

| Path | Responsibility |
| --- | --- |
| `client/public/` | **The product**: dashboard HTML + JS, Supabase config, theme helper, 404 page, boot shim |
| `client/src/` | React shell: redirect route, `NotFound`, theme context, error boundary, shadcn/Radix UI kit, hooks, `lib/utils.ts` |
| `server/` | Express static host and security headers |
| `shared/` | `const.ts` only (`COOKIE_NAME`, `ONE_YEAR_MS`) — minimal shared constants |
| `supabase/` | `schema.sql` (tables, RLS, `earn_points`) and `email-templates/` (branded HTML) |
| `tests/` | Vitest unit, jsdom DOM, and cloud suites plus the shared harness |
| `scripts/` | Git hook, hook installer, SMTP configurator |
| `drizzle/` | Tracked but unused scaffolding (`schema.ts`, `relations.ts`); no importers |
| `.ai/`, `docs/`, `AGENTS.md` | Agent memory (this system) |
| `patches/` | `wouter@3.7.1.patch`, applied via `pnpm.patchedDependencies` |
| `assets/` | `social-preview.png` (uploaded to GitHub manually) |

## Important files

| File | Why it matters |
| --- | --- |
| `package.json` | Scripts, `packageManager: pnpm@10.4.1`, pnpm patch/override config |
| `vite.config.ts` | React/Tailwind plugins, aliases, `root: client`, output `dist/public`, port 3000, dev-only Manus plugins |
| `vitest.config.ts` | Standalone test config (deliberately does not extend `vite.config.ts`), `environment: node`, 20 s timeout |
| `eslint.config.js` | Flat config; ignores `dist`, `.freebuff`, `.vercel`, `client/public/*.html`; tests disable `no-explicit-any` |
| `tsconfig.json` | Includes `client/src`, `shared`, `server`; **excludes** `**/*.test.ts` |
| `vercel.json` | Vercel build/output, `/` rewrite, full security-header set |
| `client/public/supabase-config.js` | Supabase URL, publishable key, origin-derived `redirectUrl` |
| `supabase/schema.sql` | Idempotent schema + RLS + `earn_points`; must be run once by an owner |
| `.env.example` | Owner-side variables for the SMTP configurator (`.env.local` is git-ignored) |
| `.github/workflows/ci.yml` | CI: install, lint, test (pnpm action pinned to v5 — see DEC-008) |
| `continue.md` | Canonical product/setup handoff (the long-form source of truth) |
| `PROJECT-REVIEW.md` | Prior review: verified behavior, bugs by severity, security/database findings |

## Feature map

| Feature | Owner | Key symbols / elements | Tests |
| --- | --- | --- | --- |
| Checkpoints, progress, streak, calendar | `client/public/study-dashboard.js` — the `tracks` array (all six tracks and their checkpoints) is defined near the top of this file, **not** in the HTML | `tracks`, `taskId`, `toggleTask`, `getStats`, `streak`, `renderTracks`, `renderActivity`, `updateSummary` | `dashboard-unit.test.ts`, `dashboard-dom.test.ts` |
| Mission queue | `study-dashboard.js` | `nextUp`, `renderMissionQueue`, `applyFilters` | `dashboard-dom.test.ts` |
| Weekly rhythm chart | `study-dashboard.js` | `renderWeeklyProgress`, `weeklySeries`, `dateKey`/`todayKey` | `dashboard-unit.test.ts` |
| Focus timer + journal + totals | `study-dashboard.js` | `toggleFocusTimer`, `addFocusMinutes`, `formatMinutes`, `renderFocusTotals`, journal overlay | `dashboard-dom.test.ts` |
| Spaced-repetition review | `study-dashboard.js` | `reviewDue`, `markReviewSolid`, `markReviewRedo`, `renderReviewQueue`, `daysSince` | `dashboard-unit.test.ts` |
| Personal tasks | `study-dashboard.js` | `renderCustomTasks`, `addCustomTask`, `toggleCustomTask`, `deleteCustomTask`, `formatDueDate` | `dashboard-dom.test.ts` |
| Resource canvas (drag, snap) | `study-dashboard.js` | `renderResources`, `addResource`, `deleteResource`, `validResourceUrl`, `snapToGrid`, `settlePosition`, `persistResourcePosition`, `clampToCanvas`, `resourceSnapEnabled` | `dashboard-dom.test.ts` |
| Profile card + shareable PNG | `study-dashboard.js` | `renderProfile`, `profileDisplayName`, `editProfileName`, `editSemester`, `buildProfileCardSvg`, `svgToPngBlob`, `openShareCard`, `downloadSharePng`, `copySharePng`, `animateWelcomeText` | `dashboard-dom.test.ts` |
| Semester report (print/PDF) | `study-dashboard.js` | `buildSemesterReport`, report overlay | `dashboard-unit.test.ts`, `dashboard-dom.test.ts` |
| Weekly leaderboard + nickname | `study-dashboard.js` + `weekly_points`/`earn_points` | `weekStartKey`, `weekRangeLabel`, `awardPoints`, `refreshLeaderboard`, `saveLeaderboardName`, `scheduleLeaderboardRefresh` | `dashboard-cloud.test.ts`, `dashboard-dom.test.ts` |
| Cloud sync (local-first) | `study-dashboard.js` + `study_progress` | `loadState`, `loadLocalState`, `saveState`, `flushCloudSave`, `keepaliveFlush`, `storageKeyForUser`, `normalizeState`, `migrateLegacy` | `dashboard-cloud.test.ts`, `dashboard-unit.test.ts` |
| Auth: sign-up, confirm, resend, sign-in, sign-out | `study-dashboard.js` | `ensureSupabase`, `getSupabaseConfig`, `setSupabaseClientFactory`, `init`, `applySession`, `showSignedInChrome`, `handleAuth`, `setAuthMode`, `authNeedsConfirmation`, `setResendVisible`, `resendConfirmationEmail`, `authErrorMessage` | `dashboard-cloud.test.ts`, `dashboard-dom.test.ts` |
| Password reset (recovery link) | `study-dashboard.js` | `beginPasswordReset`, `requestPasswordReset`, `saveNewPassword`, `clearUrlHash` | `dashboard-dom.test.ts` |
| Change password (signed in) | `study-dashboard.js` + `#passwordOverlay` in the HTML | `openPasswordDialog`, `closePasswordDialog`, `saveChangedPassword`, `setPasswordError` | `dashboard-dom.test.ts` |
| Keyboard shortcuts / focus cursor | `study-dashboard.js` | `keyboardRows`, `moveKeyboardCursor`, `toggleKeyboardCursor`, plus the global keydown handler (guards each open overlay) | `dashboard-dom.test.ts` |
| Theme toggle | `client/public/theme.js`, CSS `:root[data-theme="dark"]` | `sem-assist-theme` storage key | manual only |
| Cookie consent banner | `study-dashboard.js` | `initCookieBanner`, `COOKIE_CONSENT_KEY` | `dashboard-dom.test.ts` |
| 404 page | `client/public/404.html`, `server/index.ts`, `client/src/pages/NotFound.tsx` | Express catch-all returns it with status 404 | manual only |
| SMTP configuration | `scripts/configure-auth-smtp.mjs` | `PROVIDERS`, `buildConfig`, `--apply`, `--provider generic\|resend` | manual CLI checks (no automated test) |
| CI | `.github/workflows/ci.yml` | install → lint → test | n/a |

## Dependency relationships

- `client/public/study-dashboard-boot.js` → `study-dashboard.js` (`init`).
- `study-dashboard.js` → `client/public/supabase-config.js` (global `window.SUPABASE_CONFIG`)
  → `esm.sh/@supabase/supabase-js` (dynamic import inside `ensureSupabase`) → Supabase
  Auth + Postgres.
- `supabase/schema.sql` → `auth.users` (FKs), and defines `earn_points`, which the
  dashboard calls via `rpc`. Row shapes there are the contract for `study_progress` /
  `weekly_points` reads and writes.
- `vite.config.ts` → `client/` (as Vite root) → `dist/public` → consumed by both
  `server/index.ts` and `vercel.json`.
- `tests/*` → the real `client/public/study-dashboard.html` and the named exports of
  `study-dashboard.js`, with a fake Supabase client from `tests/helpers.ts`.
- Product CSS ↔ CSP: the `<style>` block and inline styles require `style-src 'unsafe-inline'`,
  and `esm.sh` must stay in `script-src`/`connect-src`. The CSP is duplicated in
  `server/index.ts` and `vercel.json` and referenced by the HTML `<meta>` tag.

## Where to look

| Task starts with… | Start here |
| --- | --- |
| Any product/DOM behavior change | `client/public/study-dashboard.html` (markup/styles) + `client/public/study-dashboard.js`; then `tests/dashboard-dom.test.ts` |
| Pure logic (dates, stats, streaks, SVG text) | `study-dashboard.js`; then `tests/dashboard-unit.test.ts` |
| Supabase session/save/leaderboard behavior | `ensureSupabase`, `applySession`, `flushCloudSave`, `awardPoints`, `refreshLeaderboard`; then `tests/dashboard-cloud.test.ts` and `tests/helpers.ts` |
| Database, RLS, or point rules | `supabase/schema.sql`; then `continue.md` → "Weekly leaderboard" |
| Auth flow, error copy, email delivery | `continue.md` → "Supabase authentication and cloud saving" / "Required manual Supabase setup"; code: `authErrorMessage`, `init`, `handleAuth` |
| Styling, themes, contrast | the `<style>` block in `study-dashboard.html` (light rules plus `:root[data-theme="dark"]` variants) |
| Deployment, headers, 404 behavior | `vercel.json`, `server/index.ts`, `client/public/404.html` |
| CI / commands | `.github/workflows/ci.yml`, `package.json`, [AGENTS.md](../AGENTS.md) |
| Test harness or fake Supabase | `tests/helpers.ts`, `vitest.config.ts` |
| Owner-side setup | `continue.md` → "Required manual Supabase setup"; `.env.example`; `scripts/configure-auth-smtp.mjs` |
