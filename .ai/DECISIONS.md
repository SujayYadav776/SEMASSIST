# Decisions — SEM ASSIST

Lightweight log of significant technical choices. IDs are stable; superseded entries
stay in compact form. "Observed choice" means the code and docs show the decision was
made but do not record who chose it or why.

## DEC-001 — The product UI is a static vanilla-JS page, not the React app
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: Ship the dashboard as `client/public/study-dashboard.html` plus one ES module. The React app in `client/src/` is only a shell that redirects `/` to it.
Reason: Not documented as an explicit choice. The shell is described as intentional ("this intentional minimal entry point routes directly to the standalone, locally persistent HTML study workbench").
Alternatives: Not documented.
Consequences: No framework runtime on the page and no build step for product code; styling lives in one embedded `<style>` block; supabase-js must be loaded from a CDN at runtime. Feature work belongs in the static files, not `client/src/**`.
Evidence: `README.md` (stack + "The product page is deliberately dependency-light"), `client/src/pages/Home.tsx`, `client/index.html`, `continue.md` → "Project status".
Relevant files: `client/public/study-dashboard.html`, `client/public/study-dashboard.js`, `client/src/pages/Home.tsx`.

## DEC-002 — Local-first persistence with optional Supabase cloud sync
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: `localStorage` is the primary store (per-user key `aster-study-dashboard-v3:u-<userId>`); Supabase `study_progress` mirrors it when the visitor is signed in.
Reason: The dashboard must work fully offline with no backend; cloud sync adds per-user continuity without being required.
Alternatives: Not documented.
Consequences: State is written locally first, then debounced to the cloud; a missing schema shows a "Could not save progress" toast rather than breaking the app. Migration of older local shapes is the code's responsibility (`migrateLegacy`, `normalizeState`).
Evidence: `study-dashboard.js` (`loadState`, `saveState`, `flushCloudSave`), `README.md`, `supabase/schema.sql`.
Relevant files: `client/public/study-dashboard.js`, `supabase/schema.sql`.

## DEC-003 — Row Level Security is the authorization boundary; the publishable key is committed
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: Commit the Supabase URL and publishable/anon key in `client/public/supabase-config.js`, and enforce per-user access with RLS policies rather than server code.
Reason: The publishable key is browser-safe **only** when RLS is enabled; there is no server-side API layer to authorise through.
Alternatives: Not documented.
Consequences: A `service_role` key must never enter the client or the repo. Every table the dashboard touches needs explicit policies, and the retention is only as strong as those policies.
Evidence: `client/public/supabase-config.js` (comment), `supabase/schema.sql` (policies), `README.md` ("Never put a `service_role` key…").
Relevant files: `client/public/supabase-config.js`, `supabase/schema.sql`.

## DEC-004 — `weekly_points` is keyed by the caller's local Monday, validated in `earn_points`
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: `week_start` is the caller's local Monday (`weekStartKey()`), not the UTC week. `earn_points` accepts `NULL` (falls back to the UTC week) or a Monday within one week of `date_trunc('week', now())::date`, and raises on anything else. The retired 3-argument overload is dropped.
Reason: The board must bucket by the same Monday–Sunday week the weekly rhythm chart displays, but time zones span UTC-12…UTC+14, so the accepted window must cover a legitimate local Monday on either side of the UTC week boundary — and a tampered key must not be able to write points into an arbitrary week.
Alternatives: Keying on UTC weeks (retired; keeping the 3-arg form would make 3-argument calls ambiguous).
Consequences: Two users in different time zones can be in adjacent buckets near a boundary — intentional, and consistent with the per-viewer rhythm chart. The client and the RPC must stay in step.
Evidence: `supabase/schema.sql` (`earn_points`, including the drop of the retired overload), `continue.md` → "Weekly leaderboard".
Relevant files: `supabase/schema.sql`, `client/public/study-dashboard.js` (`weekStartKey`, `weekRangeLabel`, `awardPoints`, `refreshLeaderboard`).

## DEC-005 — Nickname contract: `NULL` preserves the stored name, any explicit value replaces it
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: `earn_points.p_display_name = NULL` leaves the stored nickname untouched; any explicit value — including `''` from clearing the field — replaces it. Point awards send `NULL`; the nickname save sends an explicit string. Names are clamped to 16 characters in both the client and the function.
Reason: Awarding points must never wipe a nickname, and clearing the field must actually clear it; `excluded.display_name` cannot distinguish `NULL` from `''`, so the function reads the parameter instead.
Alternatives: Not documented.
Consequences: The same rule is mirrored in `tests/helpers.ts`, so the fake client and the RPC agree.
Evidence: `supabase/schema.sql` (`case when p_display_name is null …`), `continue.md` → "Weekly leaderboard".
Relevant files: `supabase/schema.sql`, `client/public/study-dashboard.js` (`saveLeaderboardName`, `awardPoints`), `tests/helpers.ts`.

## DEC-006 — `onAuthStateChange` handlers stay synchronous and never call Supabase
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: The auth-state callback performs no Supabase call; `applySession` is deferred with `setTimeout(…, 0)` and pinned to the document it was queued for. The listener is subscribed before the boot session is read, and `init()` captures `window.location.hash` before the client initialises.
Reason: supabase-js holds its auth lock while dispatching events, so a Supabase call made inside the callback deadlocks the client (Supabase: "Why is my supabase API call not returning?"). Reading the fragment afterwards is a race because supabase-js consumes it on first use.
Alternatives: Not documented.
Consequences: A source-level guard test in `tests/dashboard-unit.test.ts` pins this rule; a future refactor that makes the callback async will fail the suite.
Evidence: `continue.md` → "Auth wiring rules", `tests/dashboard-unit.test.ts`.
Relevant files: `client/public/study-dashboard.js` (`init`, `applySession`), `tests/dashboard-unit.test.ts`.

## DEC-007 — A standalone `vitest.config.ts` that does not extend `vite.config.ts`
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: Tests use their own Vitest config (`environment: node`, `include: tests/**/*.test.ts`, `testTimeout: 20000`) instead of the Vite config.
Reason: The dev/build plugins (React, Tailwind, Manus runtime/debug collector/storage proxy) must never run during tests. The dashboard tests build their own jsdom window, and the 20 s timeout exists because they drive real debounce timers (250 ms saves, 400 ms leaderboard refreshes, multi-step auth flows).
Alternatives: Not documented.
Consequences: `vite.config.ts` changes do not affect tests; conversely, tests cannot rely on Vite alias resolution.
Evidence: `vitest.config.ts` (comments state the rationale), `tests/helpers.ts`.
Relevant files: `vitest.config.ts`, `tests/helpers.ts`.

## DEC-008 — Pin `pnpm/action-setup` to v5 in CI
Status: Active
Decision date: 2026-10-10
Recorded on: 2026-10-10
Decision: `.github/workflows/ci.yml` uses `pnpm/action-setup@v5` with no `version` input (it reads `packageManager`), plus `actions/checkout@v6` and `actions/setup-node@v5` on Node 24.
Reason: `pnpm/action-setup@v6` always installs pnpm 11 regardless of the requested version, and `pnpm/setup` only supports pnpm v11+; either would break this repo's pnpm 10 lockfile (`ERR_PNPM_BROKEN_LOCKFILE`). Research recorded in the CI file's comment.
Alternatives: Using the latest action versions (rejected — lockfile incompatibility).
Consequences: Revisit the pin when the repo moves to pnpm 11 and regenerates the lockfile. `--frozen-lockfile` is used so CI cannot silently drift from `pnpm-lock.yaml`.
Evidence: `.github/workflows/ci.yml` (comment on the step), `package.json` (`packageManager`), `pnpm-lock.yaml`.
Relevant files: `.github/workflows/ci.yml`.

## DEC-009 — `pnpm check` (tsc) is not wired into CI
Status: Active
Decision date: 2026-10-10
Recorded on: 2026-10-10
Decision: CI runs install, lint, and tests only. `tsc --noEmit` is left out with a comment explaining why.
Reason: It currently fails on in-progress work in `client/src/**` (ManusDialog, `ui/carousel`, `ui/sidebar`, `hooks/useComposition`) that is unrelated to the verified suite; wiring it in would make CI permanently red.
Alternatives: Fixing the `client/src` type errors first (not done).
Consequences: Type errors in `client/src` are not caught in CI. `tsconfig.json` also excludes `**/*.test.ts`, so tests are never type-checked. Adding the check later requires clearing that backlog first.
Evidence: `.github/workflows/ci.yml` (trailing comment), `tsconfig.json`.
Relevant files: `.github/workflows/ci.yml`, `tsconfig.json`.

## DEC-010 — Local-date keys via `dateKey()` / `todayKey()`
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: All calendar/activity keys are produced locally rather than by `toISOString().slice(0, 10)`.
Reason: The ISO slice shifts the date in non-UTC time zones — a bug that was observed and fixed in this project.
Alternatives: UTC-based ISO keys (rejected after the observed bug).
Consequences: Keys are viewer-local, matching the weekly rhythm chart; any new date-derived feature must reuse these helpers.
Evidence: `continue.md` → "Weekly rhythm", `study-dashboard.js` (`dateKey`, `todayKey`).
Relevant files: `client/public/study-dashboard.js`, `tests/dashboard-unit.test.ts`.

## DEC-011 — Commits auto-push via a tracked `post-commit` hook
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: `scripts/post-commit` is the canonical hook (installed by `scripts/install-autopush-hook.sh`, or `npm run hooks:install`) and pushes `origin <branch>` after every commit. `GIT_AUTOPUSH_OFF=1` bypasses it for one commit.
Reason: Keep GitHub's contribution graph current without a manual push step.
Alternatives: Not documented.
Consequences: **Committing publishes.** Any commit created in this checkout may reach `origin/main` immediately, so commit only when asked. Hook state lives in `.git/hooks`, so fresh clones must run the installer.
Evidence: `scripts/post-commit`, `scripts/install-autopush-hook.sh`, `package.json` (`hooks:install`), `continue.md` → "Git workflow".
Relevant files: `scripts/post-commit`, `scripts/install-autopush-hook.sh`.

## DEC-012 — Deliver Supabase Auth mail through Resend custom SMTP, applied by script
Status: Active (proposed configuration not yet applied to the live project)
Decision date: 2026-10-10
Recorded on: 2026-10-10
Decision: Keep email confirmation on and point Supabase Auth at a transactional provider's SMTP server — **Resend** (`smtp.resend.com:465`, user `resend`, password = API key) — configured through `PATCH /v1/projects/<ref>/config/auth` by `scripts/configure-auth-smtp.mjs`, which is a dry run unless `--apply` is passed and never sends `mailer_autoconfirm`.
Reason: Supabase's built-in mailer only delivers to project-team addresses at 2 messages/hour, so real sign-ups failed with `{"error_code":"unexpected_failure","msg":"Error sending confirmation email"}`. Supabase lists Resend first and Resend publishes a first-party Supabase walkthrough; its fixed host/port/user make the API key the only secret.
Alternatives: Turning confirmation off (`mailer_autoconfirm: true`, documented as the alternative in `continue.md`); any other SMTP provider through `--provider generic`.
Consequences: The credentials are the project owner's (domain verification, Resend key, Management API token) and cannot be created from the repository. A new project on custom SMTP is throttled to 30 messages/hour. Accounts created while the mailer was down remain unconfirmed and need a resend. Unapplied on purpose: the script must not silently change confirmation policy.
Evidence: `scripts/configure-auth-smtp.mjs`, `.env.example`, `continue.md` → "Configure custom SMTP through a transactional email provider", `continue.md` → "Sign-up fails with…", commit `f8fc233`.
Relevant files: `scripts/configure-auth-smtp.mjs`, `.env.example`, `client/public/study-dashboard.js` (`authErrorMessage`, `resendConfirmationEmail`).

## DEC-013 — Branded email templates live in-repo but are applied by hand
Status: Active
Decision date: Unknown
Recorded on: 2026-10-10
Decision: Keep the SEM ASSIST-styled auth emails in `supabase/email-templates/` (`confirm-signup.html`, `magic-link.html`, `reset-password.html`) and paste them into Supabase → Authentication → Email Templates manually, using `{{ .ConfirmationURL }}`.
Reason: The publishable key cannot update templates, so they cannot be applied from code. Storing them in-repo keeps them reviewable and versioned.
Alternatives: Not documented.
Consequences: Template edits only take effect after a manual paste. The templates link to `https://semassist.runs-on.dev` in their footer.
Evidence: `supabase/email-templates/*`, `continue.md` → "Applying custom SEMASSIST email templates".
Relevant files: `supabase/email-templates/`.

## DEC-014 — Stage the PRD contract before relocating the working product
Status: Active
Decision date: 2026-10-10
Decision: Adopt React/TypeScript as the planned multi-roadmap UI target, but keep the current static dashboard, Vite root, hosting, and redirects working while phases 1/2 introduce `packages/roadmap-schema`, examples, and reserved `apps/web`/`skills/semassist` boundaries. Root scripts directly consume the schema package; no workspace install or dependency change is required at this checkpoint.
Reason: The user authorized phases 1/2, while `client/src/**` contains unrelated edits that repository instructions require leaving alone. Contract/migration work is independent of moving that code and of the live Supabase DNS blocker.
Consequences: `apps/web` is a documented future destination, not a functioning replacement app. Coordinate the unrelated work before relocation; phase 4 implements the new web application. Existing guest/account progress is not rewritten by this checkpoint.
Evidence: `tasks.md`, `packages/roadmap-schema`, `docs/ROADMAP_CONTRACT.md`, `apps/web/README.md`.

## DEC-015 — One Zod contract, separate semantic validation, reversible legacy staging
Status: Active
Decision date: 2026-10-10
Decision: Use installed Zod 4 for the canonical package v1.0.0 schema and derive JSON Schema on demand. Use the same semantic validator for references, dependency cycles, schedules, and baseline rules. Keep dashboard-owned records outside agent packages. Store milestone placement in schedules. Freeze a 76-checkpoint UUID mapping and retain the exact original legacy backup in a pure staging format; never infer timestamps/mastery or apply writes during staging.
Reason: Avoid duplicated contracts and protect identity/progress when schedules change. Legacy completion dates do not contain enough information to construct UTC event timestamps.
Consequences: JSON Schema-only validation is insufficient. Phase 3 must authenticate, validate claimed baselines against stored records, enforce immutable content, and transact persistence. Unsupported package versions fail explicitly; no historical roadmap package formats exist yet. Private snapshots stay ignored. The migration tool prepares data; it is not a completed account/database migration.
Evidence: `packages/roadmap-schema/src`, `legacy-task-map.json`, `tests/roadmap-schema.test.ts`, `tests/roadmap-tools.test.ts`.
