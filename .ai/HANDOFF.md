## Latest checkpoint — progress and skill metrics (2026-10-15)

Added a dedicated `?page=progress` sidebar section and Settings shortcut with reference-inspired native SVG skill radar, segmented overall progress gauge, per-skill bars, activity bars and focus area/line graph. Every skill score is rounded verified checkpoints / total * 100; built-in Python and 30 Days of Python aggregate into Python, while other personal/built-in tracks and active roadmaps remain distinct learning paths. Empty tracks show no measured score. Solid-review evidence is counted separately for completed built-in/personal checkpoints and does not inflate scores. Overall progress weights checkpoint counts and excludes personal tasks; activity charts explicitly include personal-task actions. Focus charts use dashboard timer minutes, with 7/30/90-day controls and no future/invented points. Radar shows up to eight highest-progress skills; all skills appear in the list. Next-step buttons open real checkpoints, clearing stale filters and focusing the target; roadmap tasks open their study detail. Values recompute from the existing account state/frame projection on updates and the page renders only when visible. No new persistence, dependency, cloud call or schema. Focused Progress/Settings/library checks pass 11/11; build/lint pass (one existing warning); live page/module/CSS HTTP 200; HTML CRLF preserved. Visual browser review remains pending. No commit/push. Next: user preview review.

## Latest checkpoint — five additional color palettes (2026-10-15)

Settings now offers five additional muted palettes: Sage archive, Slate studio, Sand notebook, Rose ledger and Plum archive, alongside the original Paper & charcoal. All six have light/dark variants, live swatch previews and one selected state. `appearance.js` whitelists and saves browser-wide `sem-assist-palette`, initializes color roles before paint, syncs storage events and reapplies the selected palette on theme-mode changes. Shared `palette.css` bridges the older dashboard/Roadmaps/404 tokens and sidebar colors; Roadmaps local dark study view receives the selected palette dark variant independently. Main layout/font preferences and per-user study state remain unchanged. Final Settings checks pass 3/3, including persistence, cross-document storage handling, invalid choices and text contrast (primary >=7:1, muted >=4.5:1 on paper/cards, sidebar >=4.5:1). Calendar/library checks pass 9/9. Build/lint pass (one existing warning); palette CSS returns HTTP 200. Source/HTML CRLF checks pass. Visual browser review remains pending. No commit/push. Next: user preview review; additional font choices await user input.

## Latest checkpoint — month/week all-day calendar (2026-10-15)

Calendar now has Week/Month controls and shows only all-day entries. Removed the 24-hour grid, time slots, overlap layout and session time/duration inputs. New sessions require a title/date with optional track/notes. Existing timed records retain their IDs, dates, notes and legacy numeric timing fields while rendering as all-day; edits preserve those fields. Month navigation advances to the first of the adjacent month to avoid month-end rollover, uses a Monday-aligned 42-cell grid including neighboring dates, and counts the selected month only. Track filters, search, source-task links, CRUD and storage/account safeguards remain available. Unscheduled tasks are collapsible. Focused calendar/settings/library checks pass 11/11; build and lint pass (one existing warning). HTML CRLF preserved. Visual browser review remains pending. No commit/push. Next: user preview review.

## Latest checkpoint — app settings (2026-10-15)

Added `?page=settings` with a bottom-sidebar Settings entry (also available on mobile), Theme, Fonts, Workspace and Saved data sections. Theme mode supports system/light/dark and keeps the current paper/charcoal palette; additional palettes remain deferred until the user supplies them. Body/headings/numbers selectors use the three existing local fonts, with defaults DM Sans/Heming/Heming and a restore-defaults action. Shared `appearance.js` stores whitelisted roles in browser-wide `sem-assist-fonts`; `theme.js` exposes a preference API, handles system reset and notifies the settings form. Dashboard, Calendar, Roadmaps and 404 consume the shared font roles; same-origin frame/tab storage events update appearance. Study data remains in its existing account envelope. Management buttons reuse existing page navigation/profile/data controls. Final Settings checks pass 2/2; Calendar/library checks pass 8/8; build, lint (one existing warning), release types and HTTP Settings/assets checks pass. A fresh-state test assertion was corrected because appearance changes intentionally do not create a study-state record. Visual browser review remains pending. No commit/push. Next: user provides palette/font choices and previews Settings.

## Latest checkpoint — full study calendar (2026-10-15)

Added a dedicated `?page=calendar` workspace page with seven-day time grid, all-day deadlines, mini month/week selection, previous/next/Today navigation, timezone label, track filtering and a task rail. Timed study sessions support create/edit/delete, overlap lanes, track association and notes. Normalized `calendarEvents` share per-user dashboard persistence/export/sync (500 maximum, local dates, no midnight crossing); writes preflight storage and account loading, and account changes clear drafts. Personal task due dates and effective roadmap assignment dates are displayed as all-day source entries; opening one navigates to its task. Roadmap projection includes active schedule dates and saved assignment moves without private notes. Calendar renders only when its page is visible. No new dependency or database schema. Build, lint (one existing warning), release types and HTTP page/assets checks pass; Full regression run passed 255/256 cases; the remaining failure was a search test selecting a built-in checkpoint instead of the new session. Corrected that selector; final focused calendar/library run passes 8/8, including searching from the separate Search page with an incompatible calendar filter. Browser visual review remains pending. Preview recovered as hidden Vite process 21160. No commit/push. Next: user preview review at `http://localhost:3000/study-dashboard.html?demo=1&page=calendar`.

# Handoff — SEM ASSIST

## Latest checkpoint — 2026-10-14, learning management and universal search

Home still shows Learning Tracks. `?page=learning` adds track creation, optional topics, append-only checkpoint additions, covers, a 32-icon picker and per-track sidebar visibility. Appearance settings also apply to built-in and saved-roadmap tracks. The new normalized fields `learningTracks` and `trackSettings` use the existing per-user JSON/save/sync path. `allLearningTracks` extends stats, checkpoints, queue, review, focus journals, profile badges and semester reports; built-in `tracks` stays unchanged/exported. Image uploads validate raster type/5 MB input, decode and resize to max 720×480, encode JPEG, and cap the stored URL at 240,000 characters. Storage preflight rejects failure without publishing new state. Editor drafts reset immediately on account changes; saves wait for account loading to finish. Old progress migration now passes through normalization.

`?page=find`, sidebar Search and `/` search the workspace. Results cover tracks/checkpoints, active roadmap package instructions/topics/objectives/resources/milestones, resources, personal tasks and dashboard focus notes. Roadmaps learner notes stay private in that feature. The trusted frame projection is account-tagged, and switching users clears previous roadmap search content. Results open the checkpoint (clearing incompatible local filters) or the roadmap task/detail/view. The library accepts validated view/task requests and updates its existing hash route without remounting the sync engine. New icon asset and its ISC license live in public/. No dependency or database change.

Full suite: 251/251 across 11 files; build, lint (0 errors/1 existing warning) and release types pass. Preview pages, feature code and icon module returned HTTP 200. Native browser upload/desktop/mobile visual review remains pending after the prior local-URL tool rejection. HTML/JS CRLF retained. Changes are local/uncommitted; unrelated client/src, continue.md and private preview edits are untouched. Next: user preview review; existing cloud rollout gates remain separate.

## Latest checkpoint — 2026-10-14, dashboard cleanup and dedicated pages

The top bar now contains the personalized welcome instead of the date. The calendar occupies a compact column beside Roadmap pulse without stretching to its height; its month grid fills the card. Resources, Roadmaps and Review have dedicated query URLs on the shared static dashboard document. `renderWorkspacePage` hides inactive content; `openWorkspaceSection` handles URL history/navigation, and popstate restores the selected page. The frame remains mounted for saved-track projections and sign-out recovery. Legacy roadmap links still open Roadmaps; toolbar actions and keyboard search/timer return to visible dashboard controls, while checkpoint shortcuts ignore inactive home content.

Full suite: 241/241, production build passes, lint has 0 errors and 1 existing warning. All four local page URLs and the updated navigation JS are reachable. Visual review remains pending because the browser tool blocked local URL inspection. Preview Vite runs as a hidden background process outside the sandbox (two stalled project processes were replaced); localhost port 3000 was verified with HTTP 200. Changes are uncommitted. Existing unrelated client/src, continue.md and private preview edits remain untouched. Next: user preview review.

## Latest checkpoint — 2026-10-13, theme consistency

The remaining yellow legacy components now use the home workspace's paper,
charcoal, muted-sage palette. This includes detail cards, profile/leaderboard,
controls/dialogs, Roadmaps library and study screens, share SVG, printable report
and 404 page. Roadmaps loads the shared theme script, following dashboard dark
mode. Existing records/routes/auth flows are unchanged. Browser reviewed each
major surface in light/dark; full tests passed 235/236 due only to an old default
resource-color assertion, then focused unit tests passed 61/61 after updating it.
Build passes; lint has 0 errors and one existing warning.
Committed and pushed as 1d134fb to origin/main. Unrelated client/src/**,
continue.md and .freebuff artifacts were excluded. Remaining gates are cloud
rollout, SMTP/auth, real cross-device flows and assistive-technology audit.

## Latest checkpoint — 2026-10-12, home redesign

Latest heading choice: Space Grotesk replaces the F1 Torque request. The static
dashboard and Roadmaps headings/wordmark use the local variable font in public/
fonts with its OFL license. DM Sans body/nav and approved 1.2× sizes remain.
Browser verifies font loading/computed families and default/360px page fit;
236 tests, final build and lint pass (one existing warning). New evidence:
.freebuff/home-space-grotesk.png. No commit/push/deploy or data/JS changes.

Latest correction supersedes the 2× note below: user requested 1.2× original
size while retaining DM Sans. Text sizes are 60% of the previous 2× sizes, and
compact layout columns/controls replace the large-layout overrides. New evidence
is .freebuff/home-120.png; no JS/data changes. See current task for validation.

Readability follow-up: user requested 2× text and DM Sans on the page. All static
document CSS text sizes are doubled, including legacy detail sections/dialogs.
workspace.css uses local fonts/dm-sans.ttf (OFL included); dashboard Google Fonts
links and the unused Mono font were removed. Controls/columns expand and smaller
screens stack panels for wrapping. No data/JS behavior changes. 236 tests, build
and lint pass (one existing warning); default/360px browser overflow and actual
22px/24px DM Sans were checked. New evidence: .freebuff/home-readable.png.
The Roadmaps iframe is the separate next redesign; no commit/push/deployment.

User now requests a cream/charcoal archival workspace based on their supplied
reference, starting with home. Earlier yellow-theme preservation is superseded
for this checkpoint. Product HTML/JS plus new public workspace.css implement it;
no client/src files or Roadmaps data contracts were changed. Home metrics/entries
come from existing legacy study state, not aggregate imported Roadmaps records.
Track gallery selects a read-only inspector; opening checkpoints uses stable
anchors and opens the actual track. New task/search/resource shortcuts focus
existing forms. Profile, leaderboard, security and focus history are retained
inside the inspector's profile disclosure. Existing Roadmaps iframe is unchanged.
Verification: 236/236 tests, build and lint (one existing warning) pass. Browser
checked track inspection/opening, new task focus, profile/share/pulse access,
desktop/360px/390px layout and both themes. Preview evidence is the untracked
.freebuff/home-redesign.png; do not commit private artifacts. Next is embedded Roadmaps styling.
No commit/push/deploy; cloud owner/connectivity and full accessibility gates remain.

## Latest checkpoint — 2026-10-11, remaining PRD phases 7/8

See .ai/CURRENT_TASK.md, tasks.md and docs/BACKUP_REPLAN.md for exact status.
Backup contract and baseline/mapping helpers live in shared backup.ts. The third
SQL migration serializes account operations, retains recovery receipts, provides
atomic merge/replace restore and baseline-checked activation, preserves all
schedules, and revokes direct browser metadata/pointer writes. roadmap-account
validates/authenticates those operations; import pins explicit mapping choices.
All three migrations and all three functions must deploy together. No cloud
changes were applied. The existing static yellow dashboard is preserved.

Independent skill: npm run skill:build creates dist/skills/semassist; the complete
folder/ZIP includes validator, schema, references, examples and licenses. CI adds
actual PostgreSQL/RLS cases, product types, build/hosting, Deno and skill checks.
Tests: 234/234 full, final focused library 4/4; lint 0 errors/1 existing warning;
product types, production build/HTTP hosting, Edge types and skill validation pass.
Full root tsc remains red on unrelated shell edits. Private preview artifacts are
in .freebuff and must not be committed. No commit/push was requested this turn.

Remaining gates: reachable Supabase and owner deployment/SMTP access, live auth/
two-device isolation and all five PRD flows, full WCAG assistive-technology audit.
A DNS query returned addresses, but HTTPS health still failed resolution; do not
claim service recovery. Browser download-event capture stalled; actual library
controls were verified with jsdom, and UI phone overflow/layout were checked.

## Previous phase-5/6 checkpoint (historical)
StudyWorkspace adds all six study views inside the original yellow dashboard.
StudySync owns account/roadmap IndexedDB snapshots and ordered durable outboxes.
Learner validation/field-level conflict merge lives in the shared schema package;
cloud mutations go through roadmap-mutate and a service-only receipt RPC in the
202610110001 migration. The preceding undeployed migration now permits learner
row cascades when a parent roadmap is deleted. No cloud changes were applied.

The demo browser verified completion, plain notes and 15 logged minutes after a
nested-route reload. Sync tests cover offline ordered replay, closure recovery,
lost acknowledgements, independent-field merges, same-field note conflicts,
cache failures, account ownership, disposal and drafts edited during refresh.
Full suite passed 218/218 and final focused study checks passed 23/23; lint passed with one pre-existing warning; roadmap
app/schema typechecks and production build passed.
tasks.md records the final evidence. Full PostgreSQL/Edge execution, second-device
exchange and a complete WCAG audit remain open. Supabase DNS still fails.

Account cache clearing/signout exports and confirms pending edits; other study
tabs must close first. One Web Lock holds the browser editing workspace for a
roadmap, preventing tabs overwriting an outbox. Unread cache data blocks opening instead of replacing pending work. Cache write
failures use a visible
localStorage recovery fallback and in-memory download. Offline study is for an
already-loaded page with opened data; there is no offline app-shell/service worker.
Settings recovery copies are not the full-account phase-7 restore contract.

Deploy both SQL migrations and both Edge functions once the project is available;
verify duplicate mutation delivery, simultaneous edits, account isolation, and
cache/signout safety live. Do not commit/push unless requested. Leave unrelated
client/src and continue.md edits alone. Phase 7 requires user direction.

## Earlier checkpoint — 2026-10-10, PRD phases 3/4
Phase 3/4 local implementation was authorized after phases 1/2. The shared Zod
contract and validator remain in `packages/roadmap-schema`. New code includes
`supabase/migrations/202610100001_roadmap_library.sql` (owner-scoped tables/RLS,
immutable revisions/schedules, learner record tables, server revision triggers,
import receipts, transactional import/restore/schedule activation) and
`supabase/functions/roadmap-import` (bearer-session verification, shared package
validation, canonical digest, service-role-only import RPC). The React library is
at `/roadmaps.html`, embedded from the original dashboard's **Roadmaps** nav
inside its existing card layout and yellow/cream/charcoal theme. It has account
auth/list/import and a browser-local demo preview, search, switching,
duplication, archive/delete, export, and confirmed import preview. See
`apps/web/README.md` for local/cloud setup.

Do not move or edit the unrelated dirty `client/src/**` work. The library is a
separate Vite entry at `client/roadmaps/`, embedded in the existing
`/study-dashboard.html`; direct `/roadmaps.html` access remains available.
Vercel builds both entries through `npm run build` and rewrites `/roadmaps` to
the new app.

The Vite production bundle and server bundle built; the full suite passed
(193/193), and lint passed with the existing warning in `vite.config.ts`. After
integrating the library into the legacy dashboard, the dashboard DOM suite
passed (88/88), lint passed again, and the production build passed again. The preview now
shows topic/task field changes, proposed carryover mappings, and workload totals,
peak daily load, and capacity overruns. The local browser preview previously
imported the beginner Python fixture and showed the saved roadmap. Node native
realpath is denied by this sandbox (EPERM), so build/test commands used a
process-only compatibility override; there is no repository workaround. The
Supabase host still fails DNS, so migration deployment, auth, another-device
retrieval, and two-account isolation are unverified; no live cloud configuration
or data changed. Learner mutation idempotency remains in phase 6. No commit or
push was requested for this phase. `tasks.md` is authoritative for remaining
work. Phase 1/2 evidence and prior SMTP handoff are retained below as history.

## Last updated

2026-10-10 22:10 SLST (+0530).

## Verified baseline

- Repository root: `E:\Git Hub\EDU_Lad\jain-study-dashboard` (branch `main`, tracking
  `origin/main`, in sync).
- Inspected HEAD: `07627819773012c188a835dd0379518bfd7f7ce3` ("Let smtp:configure read
  .env.local so the documented setup works verbatim"). Remote `refs/heads/main` matched
  this SHA when checked, so the inspection is not of local-only work.
- Working tree at inspection (working-tree observations, not part of any commit):
  - Modified, **not mine — another work stream**: `client/src/components/ManusDialog.tsx`,
    `client/src/components/Map.tsx`, `client/src/components/ui/{carousel,chart,dialog,input,sidebar,textarea}.tsx`,
    `client/src/hooks/usePersistFn.ts`, `client/src/pages/Home.tsx`. Do not attribute,
    revert, or commit these without asking.
  - Untracked: `.freebuff/` (agent scratch), and this memory initialization
    (`AGENTS.md`, `.ai/`, `docs/`) which was created after the baseline was captured.
- Ignored and therefore not inspected as source: `node_modules/`, `dist/`, `.pnpm-store/`,
  `.manus-logs/`, `.vercel/`, `client/public/__manus__/`.

## Current objective

Set up a transactional email provider so Supabase confirmation, resend, and
password-reset emails can actually be delivered. See [CURRENT_TASK.md](CURRENT_TASK.md).

## What was done

1. **Diagnosed** the sign-up failure and confirmed it is not a page bug: Supabase's
   built-in mailer only delivers to project-team addresses at 2 messages/hour, so
   `POST /auth/v1/signup` returns 500
   `{"error_code":"unexpected_failure","msg":"Error sending confirmation email"}` and no
   account can be confirmed. Custom SMTP is a project-owner Management API change.
2. **Built the configurator** `scripts/configure-auth-smtp.mjs`: dry run by default,
   `--apply` to write, `--provider resend|generic`, password redacted from all output,
   reads the config back after writing, and deliberately never sends
   `mailer_autoconfirm` so it cannot silently change confirmation policy.
3. **Added the owner-side plumbing**: `.env.example`, the `smtp:configure` npm script,
   and a full "Configure custom SMTP through a transactional email provider" section in
   `continue.md`.
4. **Made the documented flow actually work**: `smtp:configure` now passes
   `--env-file-if-exists=.env.local`, because the docs told owners to use `.env.local`
   while the script read only exported variables.
5. **Added CI** (`.github/workflows/ci.yml`) and committed the residual dark-mode fix
   from the previous session's change-password work.
6. **Committed and pushed** `f8fc233` and `0762781` via the auto-push hook.

## Files changed and why

| File | Change |
| --- | --- |
| `scripts/configure-auth-smtp.mjs` | New — Management-API SMTP configurator (dry run, `--apply`, Resend preset, generic SMTP path, redaction, exit codes 0/1/2) |
| `.env.example` | New — tracked template for `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `RESEND_API_KEY`, `SMTP_SENDER_EMAIL/NAME`, commented generic vars |
| `package.json` | Added `smtp:configure` (loads `.env.local`) |
| `continue.md` | Custom-SMTP section, `.env.local` copy step, and the SMTP diagnosis cross-reference |
| `.github/workflows/ci.yml` | New — install / lint / test on push and PR |
| `client/public/study-dashboard.js` | `setPasswordError(message, status)` gained the `is-status` class so in-progress "Saving…" copy stops wearing the red error colour |
| `client/public/study-dashboard.html` | `.import-error.is-status` light/dark colour rules |
| `tests/dashboard-dom.test.ts` | Two assertions pinning the status/error slot separation |
| `AGENTS.md`, `.ai/*`, `docs/CODEBASE_MAP.md` | New — this agent-memory layer (uncommitted) |

## Important discoveries

1. **`process.exit()` after a live `fetch` is unsafe on Windows.** Calling it immediately
   after a request left undici's sockets mid-close and tripped a libuv assertion
   (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76`),
   replacing a correct exit code 1 with **127**. All exits in the script now use
   `process.exitCode = N; return;`.
2. **A mistyped flag used to exit 0.** An unknown argument printed help and exited
   successfully, so a typo read as success. Unknown args now print
   `Unknown argument: <x>` and exit 2.
3. **CI must pin `pnpm/action-setup@v5`.** `@v6` always installs pnpm 11 regardless of the
   requested version, and `pnpm/setup` only supports pnpm v11+, either of which breaks this
   repo's pnpm 10.4.1 lockfile (`ERR_PNPM_BROKEN_LOCKFILE`). See DEC-008.
4. **`pnpm` may not be on PATH.** `npm run …` works for every script; for installs keep the
   lockfile with `npx --yes pnpm@10.4.1 install`.
5. **The npm `start` script is POSIX-only** (`NODE_ENV=production node …`), so it will not
   run in a bare `cmd.exe`.
6. **`drizzle/` is dead scaffolding** — tracked, imported nowhere, and `drizzle-orm` is not
   even a dependency.
7. **The live Supabase host did not resolve here** (`ENOTFOUND` for
   `nrxbelpmydquivcphxry.supabase.co` via both `curl` and `node fetch`, while
   `api.supabase.com` and `esm.sh` resolved), so live auth settings could not be re-read.
8. **`gh` is not installed** and no GitHub token is available, so CI runs cannot be observed
   from this environment.
9. **Supabase's own mailer limits** are the root cause, and they are documented: team
   addresses only, 2 messages/hour. After custom SMTP the ceiling becomes 30 messages/hour
   until raised in Authentication → Rate Limits.
10. **Resend has no provisionable path** in the Gravity Index catalog (`get_service` returns
    "Direct user to get key", and the recommender returns `null` for SMTP relays), so the
    account genuinely must be the owner's.

## Decisions made

- DEC-012 — Resend custom SMTP applied by script, confirmation left on.
- DEC-008 — `pnpm/action-setup` pinned to v5.
- DEC-009 — `tsc` deliberately not wired into CI.
- (Full log, including earlier architectural choices: [DECISIONS.md](DECISIONS.md).)

## Known problems

- **Blocking the objective:** no Resend account / verified domain / API key, and no Supabase
  Management API token. Nothing in the repository can supply these.
- Accounts created while the mailer was broken are still unconfirmed and need a resend or a
  password reset.
- `supabase/schema.sql` may still need a single manual run in the SQL Editor; until then
  cloud saves fail with "Could not save progress" and the leaderboard stays empty.
- `npm run check` (tsc) fails in `client/src/**` (pre-existing, unrelated stream).
- Uncommitted by design: `client/src/**` edits and `.freebuff/`.

## Validation

| Check | Where | Result |
| --- | --- | --- |
| `npm test` (`vitest run`) | repo root | **Passed** — 156 tests, 3 files |
| `npx eslint scripts/configure-auth-smtp.mjs` | repo root | **Passed** — exit 0 |
| `npm run lint` (`eslint .`) | repo root | **Passed** for the committed state — 0 errors; 1 pre-existing `no-explicit-any` warning in `vite.config.ts` |
| Script exit codes: `--help` 0 · missing env 2 · unknown flag 2 · unknown provider 2 · bad port 2 · Resend dry run 0 · `--apply` with bad token 1 | repo root | **Passed** — every path re-run after the final edits |
| `.env.local` loading (`npm run smtp:configure -- --provider resend`) | repo root | **Passed** — with a temporary `.env.local`, quoted `SMTP_SENDER_NAME` parsed, `smtp_pass` shown as `***`, exit 0; temp file deleted |
| `npm run check` (`tsc --noEmit`) | repo root | **Failed** — pre-existing errors in `client/src/**`; not wired into CI |
| CI workflow run on GitHub | GitHub | **Not run / Blocked** — `gh` unavailable and no token; only the individual steps were reproduced locally |
| Live Supabase auth settings and real email delivery | — | **Blocked** — DNS for the project host fails from this environment |
| `pnpm install --frozen-lockfile` (CI's install step) | temp dir | **Passed** — exit 0 in the previous session (needs the tracked `patches/wouter@3.7.1.patch`) |

## Recommended next steps

1. Get `RESEND_API_KEY` + `SUPABASE_ACCESS_TOKEN` from the owner, put them in `.env.local`,
   run the dry run, then `--apply`, and confirm the read-back.
2. Sign up with a real address and watch the send appear in the provider's dashboard.
3. Recover the stranded unconfirmed accounts (resend confirmation, or a password reset).
4. Confirm `supabase/schema.sql` has been applied, and smoke-test a checkpoint tick.
5. Once the mailer works, revisit whether `authErrorMessage`'s SMTP guidance should
   reference the provider by name.

## Suggested starting points

- `scripts/configure-auth-smtp.mjs` — read `buildConfig` and the `--apply` path before changing anything.
- `continue.md` → "Required manual Supabase setup" — the owner steps and the diagnosis.
- `client/public/study-dashboard.js` — `authErrorMessage`, `resendConfirmationEmail`, `setResendVisible`, `init`.
- `supabase/schema.sql` — the RLS/point contract, if a data change is next.
- `tests/dashboard-cloud.test.ts` + `tests/helpers.ts` — the fake-Supabase seam used for auth/sync work.

## Prompt for the next agent

Copy this as the opening message:

> Resume work in this repository (`jain-study-dashboard`, branch `main`).
>
> Start by reading `AGENTS.md`, then `.ai/CURRENT_TASK.md` and `.ai/HANDOFF.md`; use
> `docs/CODEBASE_MAP.md` and `continue.md` only for the parts your task touches. Verify the
> working tree with `git status --short --branch` before changing anything, and leave the
> pre-existing edits in `client/src/**` alone — they belong to another work stream.
>
> The active objective is to make Supabase Auth email (sign-up confirmation, resend,
> password reset) actually deliver, which is currently blocked on the project owner's Resend
> account and Supabase Management API token. If I have supplied `RESEND_API_KEY` and
> `SUPABASE_ACCESS_TOKEN`, put them in `.env.local`, run
> `npm run smtp:configure -- --provider resend` as a dry run, then run it with `--apply`,
> read the config back, and verify a real send end to end. If I have not supplied them, tell
> me exactly what you need and what you checked instead of guessing.
>
> Do not commit or push unless I ask: the `post-commit` hook publishes automatically. Verify
> with `npm test` (expect 156 passing) and `npm run lint`; note that `npm run check` is
> already red in `client/src/**` and is not part of CI.


## Calendar drag and drop — 2026-10-15

Native drag/drop now moves study sessions, personal deadlines and learning/roadmap checkpoint plans between Week/Month dates, and schedules from or returns checkpoints to Unscheduled. Highlighted targets and live save feedback use the current theme. A date-picker button provides keyboard/touch planning. Sessions retain notes/legacy fields; personal tasks update dueDate; per-user calendarTaskDates stores checkpoint calendar plans with explicit null for unscheduled, separate from original Roadmaps schedule dates shown in the picker. Local-storage/account-load guards run before applying changes; account/navigation reset clears drag state. Final Calendar checks pass 6/6 and Settings 3/3; production build passes; lint has 0 errors and its pre-existing vite.config.ts warning; HTML CRLF and diff checks pass. The first drag-back regression assertion read the old document after a simulated reload; it now uses the reloaded document and passes. Browser visual/touch review remains pending. No commit/push. Next: user tries the calendar preview.


## Unfinished calendar carry-forward — 2026-10-15

Unfinished dated calendar sessions, personal tasks and built-in/custom/roadmap checkpoints now display on the current local day, carrying forward through every missed day. Soft red cards include a text label and original assigned date. Completed, future and explicitly unscheduled entries do not roll. Projection recomputes from stored assignments without automatic writes or duplicates, including after reload; manual drag/date changes still persist normally. Sessions have a persisted Completed checkbox. Calendar refreshes at local midnight, focus/visibility return and existing state updates, following today when it was selected. Calendar checks pass 8/8, including leap/month boundaries, real DOM rendering, completion, next-day focus catch-up and existing drag/storage flows. Production build passes; lint has 0 errors and one existing vite.config.ts warning. HTML CRLF/diff checks pass. Visual review remains pending. No commit/push. Next: user reviews carried cards in the preview.


## Production rollout and matching account entry — 2026-10-15

Published clean committed source 714b12c to the linked Vercel production project. Final deployment dpl_7TaMkc6eQGKKwH5iMU63xfZQu8Uz is READY and aliased to https://semassist.runs-on.dev (inspector: https://vercel.com/xeo776-5408s-projects/jain-study-dashboard/7TaMkc6eQGKKwH5iMU63xfZQu8Uz). The first upload failed transiently; retry succeeded. Initial publish exposed root serving the Vite shell; scripts/finalize-public.mjs now copies the product HTML to index.html during builds. Final unauthenticated public HTTP checks confirm / and /study-dashboard.html match the latest HTML, including new paper/charcoal auth-shell, home skill radar and session completion control. Dashboard JS, workspace/auth/progress CSS, appearance/calendar/progress/icons modules and /roadmaps plus its JS/CSS assets all return 200; public static sources match local committed files. Focused auth checks pass 27/27; build, production route/security checks and root artifact parity pass; lint has 0 errors and the existing vite.config.ts warning. Login/signup/recovery controls retain existing IDs/behavior with shared font/palette roles and responsive layout. Live account sign-in and browser visual review were not exercised. Source commits f9d8418 and 714b12c were pushed; unrelated client/src edits remain excluded. Next: user opens production for visual review.
