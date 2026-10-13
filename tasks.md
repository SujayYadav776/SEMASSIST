# SEMASSIST implementation checklist

Last updated: 2026-10-13 (Asia/Colombo)

Source: [PRD v1.1](../SEMASSIST-agent-handoff/PRD.md), dated 2026-10-10.
Status: phases 2–7 and the local phase-8 skill/release tooling are implemented. Cloud rollout, SMTP/auth, real cross-device flows, and the full assistive-technology audit remain open. No commit, push, or production deployment was performed in this session.

## Updating this checklist

- Update this file after every completed checkpoint and at the end of every work session.
- Check an item only after its stated behavior is implemented and verified. Partial work stays unchecked with a short progress note.
- Record validation results, blockers, and the next action below. Distinguish mocked tests from live verification.
- Keep `.ai/CURRENT_TASK.md` aligned; update `.ai/HANDOFF.md` for substantial handoffs.
- Preserve existing learner data and unrelated working-tree edits. Never record credentials here.

## Website redesign — checkpoint 1: home dashboard

The user's new reference supersedes the earlier yellow-theme preservation request
for the home dashboard. Scope is a paper/charcoal study workspace, using actual
SEM ASSIST content while preserving existing data, anchors, auth and study actions.
Audit: the old home used gray/yellow gradients, DM Sans/Manrope, large rounded cards
and horizontal navigation; checkpoints, focus, review, resources, profile and embedded
Roadmaps are retained. New direction: native CSS, self-hosted Share Tech Mono,
variance 3 / motion 1 / density 8. Marketing-only skill rules do not fit this product UI.

- [x] Implement charcoal sidebar, compact toolbar and five-part semester overview.
- [x] Add learning-track visuals and an interactive inspector using real track progress.
- [x] Show the existing checkpoint queue, focus timer/journal, recent study entries and resource shelf.
- [x] Preserve profile/security/leaderboard controls, exports, existing routes and learner storage.
- [x] Verify inspector selection/opening, new-task focus, and page overflow at desktop/390px/360px.
- [x] Verify both themes and keep keyboard focus on the selected track.
- [x] Complete final automated regression checks and save preview evidence.
- [x] Apply the latest readability correction: 1.2× original static-page text
  sizes with local DM Sans, compact controls and no phone overflow.
- [x] Apply Space Grotesk headings, as chosen instead of F1 Torque. Self-host
  the font/license; retain DM Sans body/navigation and the 1.2× size.
- [x] Redesign the embedded Roadmaps library and study screens in the same visual language.
- [x] Restyle the remaining detailed study, resource, profile and account screens.
- [x] Match the shareable profile card, print report and 404 page to the new palette.

Checkpoint validation: all 236/236 tests in 10 files pass with one worker;
production build passes; lint has 0 errors and the existing vite.config.ts warning.
The initial CLI timeout passed with lower concurrency; the new test's missing
jsdom scroll mock was fixed. Browser checked selected-track/open-checkpoint/new-task
actions, profile/share/pulse access, both themes and desktop/phone overflow.
Preview: .freebuff/home-redesign.png. HTML remains CRLF, font/license and Lucide
icon license are local, with no new runtime dependency. No commit/push/deploy.

Readability follow-up, 2026-10-12: replaced the initial Mono styling with local
DM Sans and 2× font sizes throughout the static dashboard document. Browser
verified DM Sans loads, nav 12→24px, panel labels 11→22px and default/360px widths.
Panels now require more vertical scrolling. The separate Roadmaps iframe retains
its existing DM Sans-based styling until its redesign. New evidence:
.freebuff/home-readable.png. Final 236/236 tests, build and lint pass (one existing
warning). No commit, push, deployment or study-data changes; next checkpoint
remains the Roadmaps visual redesign.

Scale correction, 2026-10-12: user found 2× too large and requested 1.2× original.
Reduced font declarations to 60% of the previous 2× version, kept DM Sans and
restored the compact workspace. Browser verifies 14.4px nav, 13.2px panel labels,
default/360px page fit and no clipped phone summary text; 1170px inspector fits.
All 236 tests, build and lint pass (one existing warning). Evidence saved at
.freebuff/home-120.png; temporary viewport reset. No study-data/JS changes,
commit, push or deployment. Next action remains the Roadmaps visual redesign.

Session log, 2026-10-12: completed the authorized home redesign. Existing learner
data/auth/navigation were preserved; no demo records were created or deleted by
UI checks. Next: Roadmaps study-screen visual redesign. Live cloud/SMTP and full
assistive-technology gates from the PRD remain unverified.

Theme checkpoint, 2026-10-13: replaced the remaining yellow surfaces and controls
with paper, charcoal and muted track colors across the legacy detail screens,
profile/leaderboard, auth dialogs, embedded/standalone Roadmaps, its study views,
the exported profile image, print report and 404 page. The existing shared theme
script now also initializes Roadmaps, so the iframe follows light/dark changes.
No learner data, routes or account logic changed. Browser checked profile spacing,
Roadmaps library and study view in both themes, the share card, report and 404.
The full test run passed 235 checks and found one old default-color expectation;
after updating that assertion, all 61 focused unit checks passed. Final build
passes and lint has 0 errors/1 existing warning. Next: review the remaining PRD cloud
rollout gates and push the authorized local work without unrelated shell edits.

## Preparation already completed

Heading-font session, 2026-10-12: implemented the user's Space Grotesk choice
on static-page and embedded Roadmaps headings/wordmark. Both apps reference the
same public font with its OFL license; no package dependency or data changes.
Browser verified actual loaded/computed fonts and default/360px page fit.
All 236 tests, build and lint pass (one existing warning). Evidence:
.freebuff/home-space-grotesk.png. No commit/push/deploy; next is Roadmaps redesign.

Font investigation session, 2026-10-12: checked F1's official guidelines and
the current heading selectors. No licensed F1 asset was supplied, so no product
code/font changes were made. Next: receive the licensed font or an alternative
choice, then apply headings only. No tests needed for this read-only investigation.

- [x] Read the project handoff and verify the main architecture against source.
- [x] Read PRD v1.1 and compare its requirements with the current application.
- [x] Produce a phased implementation plan and this checklist.
- [x] Open a localhost-only guest preview at `/study-dashboard.html?demo=1`.
- [x] Verify the preview change: 158 tests passed; lint passed with one existing warning.
- [x] Attempt live signup/sign-in and identify the configured Supabase host's DNS failure.

## 1. Foundation and safe migration

- [ ] Verify the Supabase project's availability and current URL; resolve the DNS blocker.
- [ ] Configure owner-provided SMTP credentials and verify signup, confirmation, sign-in, resend, and password reset live.
- [ ] Verify deployed schema, auth redirect URLs, and branded email templates.
- [ ] Inventory existing local/cloud data and create a recoverable export before migration.
- [x] Resolve the proposed React/monorepo transition against current static-product conventions; document the architecture decision.
- [ ] Coordinate existing unrelated React edits before moving or changing their files.
- [ ] Organize `apps/web`, `packages/roadmap-schema`, `skills/semassist`, `examples`, and `docs` while preserving a working legacy dashboard.
- [x] Define explicit migration mappings from existing positional checkpoint IDs to stable opaque IDs; preserve progress, resources, personal tasks, and relevant history.
- [x] Verify legacy migration with fixtures and a rollback/recovery path.

Progress: DEC-014 records staged migration. `packages/roadmap-schema`, `examples`,
`apps/web`, `skills/semassist`, and contract docs exist; actual web relocation and
workspace wiring remain deferred until unrelated React work is coordinated.
The current guest preview was exported and staged in ignored
`.freebuff/semassist-migration/guest-{backup,staged}-2026-10-10.json` (zero completed
checkpoints). This covers local guest data only, so the full local/cloud inventory
item stays unchecked. Original backup bytes are retained; staging applies no writes.
The owner confirmed the existing Supabase URL, which still fails DNS. No
`.env.local` owner credentials are present; live schema/auth/template checks remain blocked.

Checkpoint: existing users have a recoverable migration path; two real test accounts can authenticate.

## 2. Shared contract and validator — FR-02/03/04/05/06/07

- [x] Define one canonical runtime schema and its JSON Schema representation; reuse installed dependencies where suitable.
- [x] Define packages, roadmaps, immutable content revisions, topics, tasks, resources, schedules, assignments, milestones, and mappings.
- [x] Separate imported definitions from dashboard-owned progress, notes, mastery, and mutation records.
- [x] Specify schema versions/migrations, stable IDs, local ISO dates, IANA timezones, UTC event timestamps, and duration semantics.
- [x] Define task types, required/optional flags, minutes, objectives, completion criteria, and explicit review task identities.
- [x] Validate configurable upload size (initially 5 MiB), supported versions, duplicate IDs, references, dependency cycles, dates/durations, assignments, and HTTP(S) URLs.
- [x] Validate prerequisite order with explicit review exceptions and documented overrides; report capacity violations visibly.
- [x] Produce actionable field-path errors and valid/invalid/migration fixtures.

Evidence: shared Zod v1.0.0 schema, semantic validator, derived JSON Schema, CLI
validation and migration tools, beginner/cycle/replanned/legacy fixtures, and 33
new contract/tool tests. `npm test`: 191 passed across 5 files; `roadmap:check`:
passed; lint: 0 errors/1 existing warning. Overrides return preview warnings;
showing those warnings and client/server integration belong to phases 3/4.
See `docs/ROADMAP_CONTRACT.md` for exact semantics and remaining trust boundaries.

Checkpoint: valid beginner Python packages pass; unsafe, cyclic, oversized, or inconsistent packages fail without mutating data.

## 3. Account storage and server operations — FR-01/03/08/09

- [x] Add versioned database migrations, ownership relationships, integrity constraints, and owner-only RLS.
- [x] Derive ownership from the authenticated session; never trust account IDs supplied by packages.
- [x] Apply the shared validator server-side before persistence.
- [x] Implement atomic import, stored-revision restore, and schedule-activation operations with baseline revision checks.
- [x] Add import IDs/content digests for retry-safe imports; add learner mutation IDs in phase 6.
- [x] Assign authoritative server revisions and enforce conflict checks without device-clock ordering.
- [ ] Verify two-account isolation for reads, writes, imports, restores, and related records.

Progress: migration `supabase/migrations/202610100001_roadmap_library.sql` adds
owner-scoped tables/RLS, immutable definitions, learner records, server revision
triggers, and transactional import/restore/activation operations. The
`roadmap-import` Edge Function authenticates the bearer session, uses the shared
validator, hashes canonical content, and calls a service-role-only import RPC.
The migration and function are not applied to the live Supabase project.

Checkpoint: transactional database paths are implemented; two-account isolation,
live retries, and migration deployment remain unverified. Durable learner-mutation
idempotency belongs with the sync/outbox work in phase 6.

## 4. Roadmap library and import — FR-01/03

- [x] Build My Roadmaps with search, roadmap switching, title/goals/subject/level, and export.
- [x] Implement independent duplication with new identity and fresh progress.
- [x] Implement reversible archive and explicitly confirmed deletion with consistent related-record handling.
- [x] Add JSON file upload and client validation feedback.
- [x] Preview new roadmaps versus revisions, topic/task field changes, workload, and proposed progress mappings.
- [x] Persist only after confirmation; cancellation changes nothing.
- [ ] Import a beginner Python fixture and retrieve it under the same account on another device.

Progress: `/roadmaps.html` remains the library entry and is embedded in the
existing dashboard under its **Roadmaps** navigation, using the dashboard's
yellow/cream/charcoal theme. It leaves unrelated `client/src/**` edits
untouched. Local preview is available from
`/study-dashboard.html?demo=1` → **Roadmaps**; demo data is isolated in local
storage. Account-backed import and library reads use Supabase when configured.
The Python sample is available as a one-click import fixture.

Checkpoint: local library/import flow is available. Cloud retrieval on a second
device and live auth are not verified because the configured Supabase host does
not resolve in this environment.

Preview verification: stable topic/task IDs are compared field-by-field; the
preview shows additions/removals/changed fields, proposed carryover mappings,
scheduled minutes, peak day load, and over-capacity days. Two focused diff tests
pass. Sequential import retries reuse the stored receipt; learner mutation
idempotency remains in phase 6.

## 5. Study views and task workflows — FR-04/05/07/10

- [x] Implement Overview, Roadmap, Schedule, Resources, Progress, and Settings routes.
- [x] Add roadmap switcher, desktop sidebar/breadcrumb, and adaptive phone navigation.
- [x] Show today's tasks, next unfinished task, upcoming milestone, and compact progress.
- [x] Build task detail with instructions, objective, type, estimated time, criteria, resource references, note, and completion/reopen controls.
- [x] Add daily/weekly schedule grids, workload totals, practice/review/catch-up sessions, and keyboard/touch date moves.
- [x] Warn on workload/prerequisite violations without silently replanning.
- [x] Implement dependency list and graph with topic details, prerequisites, and associated tasks.
- [x] Calculate required completion correctly; exclude optional/inactive tasks and handle an empty required set explicitly.
- [x] Share completion across schedules within a roadmap; give deliberate review repetitions distinct task IDs.
- [x] Support external resource links, chapter/page/section/timestamp locators, access status, provenance, and reference-only private/local sources.
- [x] Render imported content as escaped text; reject unsafe URLs and isolate external tabs. Opening resources never completes tasks.
- [x] Record completion timestamps, plain-text notes, manual study time, separate topic mastery, and milestone evidence/status.
- [x] Add account, study recovery export, timezone, theme, and sync settings; retain existing dashboard features. Full-account backup/restore remains phase 7.

Checkpoint: the Python fixture renders every core study view; task completion and mastery remain independent.

## 6. Durable sync and responsive accessibility — FR-08/10

- [x] Cache previously opened roadmap data in account-scoped IndexedDB.
- [x] Persist optimistic changes and ordered outbox mutations with mutation/account/entity IDs, baseline revisions, and payloads.
- [x] Display synced, pending, offline, conflict, and error states accurately.
- [x] Retry on reconnect, page focus, subsequent online page load, and manual retry; refresh after writes/focus.
- [x] Preserve pending records across page closure and deduplicate acknowledgements.
- [x] Merge independent field/entity changes; surface same-field conflicts and preserve both note versions for user resolution.
- [x] Warn/export before discarding unsynced work on sign-out/account switch; safely isolate and clear account cache.
- [x] Show IndexedDB failures and preserve recoverable pending data where possible.
- [x] Guard initial uncached study load and imports; account login and cloud activation require an online service. Cached study data remains usable offline while the loaded page remains open.
- [ ] Verify live login, restore, and activation online requirements once the project is available (restore UI is phase 7).
- [x] Smoke-check 360px phone, 768px tablet and desktop layouts, 44px visible study targets, keyboard navigation/focus, and reduced-motion rules.
- [ ] Complete the full WCAG 2.2 AA audit, including assistive technology and contrast across all views.
- [x] Verify graph/list accessibility and no page-wide horizontal scrolling; graph panning stays inside its region.
- [x] Verify direct links and refresh on nested routes.

Checkpoint: ordered offline replay, lost-acknowledgement deduplication, account isolation, and recoverable conflicts pass local tests. Live laptop/phone exchange remains blocked by Supabase DNS; SQL/Edge deployment has not occurred.

## 7. Backup, restore, and replanning — FR-06/09

- [x] Provide roadmap-only export, minimal replanning snapshot, and versioned full-account backup with schedules/progress/notes/export timestamp.
- [x] Exclude personal notes from replanning snapshots by default; include baseline IDs, completion, mastery, and target constraints.
- [x] Validate restore separately from agent import; preview merge/replace, ID collisions, and unsupported versions.
- [x] Preserve a pre-restore snapshot/downloadable backup; apply restore transactionally within the authenticated account.
- [x] Separate content revisions from schedule versions; duration changes reuse stable task definitions.
- [x] Define total versus additional duration and calendar versus eligible study days explicitly.
- [x] Preview and activate candidate schedules atomically while retaining the original schedule.
- [x] Retain unchanged completion; new tasks start incomplete; removed tasks keep history outside the active view.
- [x] Require explicit split/merge/substantial-change mappings; preserve original notes unless explicitly copied.
- [x] Reject stale automatic activation and require an updated preview when the baseline changes.
- [x] Verify 15-to-30-day replanning and full-backup restore round trips with preserved IDs/progress and atomic failure cases.

Checkpoint: replanning never silently overwrites learner records; backup restores definitions, schedules, and progress reliably.

## 8. Companion skill and hosted release — FR-02/10

- [x] Create independently distributable `semassist` skill instructions with the versioned contract and validator.
- [x] Collect learner level, goal, minutes, duration/deadline, start date/timezone, study days, and sequencing preference; report assumptions.
- [x] Analyze supported accessible sources; record access limitations, confidence, provenance, and primary/supplementary references.
- [x] Deduplicate overlap; classify prerequisite/core/optional/advanced material and offer source-faithful versus optimized sequencing.
- [x] Produce feasible schedules with practice, revision, catch-up capacity, and milestone criteria; explain workload gaps instead of overpacking days.
- [x] Generate initial and replanning packages without directly writing learner progress or including admin credentials.
- [x] Document installation, source limitations, import/replan/backup workflows, migration, and recovery.
- [x] Resolve theme/density/sign-in/hostname defaults and verify hosting compatibility during implementation.
- [x] Resolve applicable TypeScript failures, then add typecheck/build and contract/security/integration checks to CI alongside lint/tests.
- [ ] Deploy HTTPS with correct routes, headers, CSP, auth redirects, and verified account storage.
- [ ] Pass all five PRD flows live: generate/import, study across devices, connection recovery, replan, and backup/restore.
- [ ] Verify no acknowledged-progress loss, cross-account exposure, silent mapping, or invisible workload override.

Checkpoint: the hosted release and independently installed skill complete the representative flows together.

## Deferred / outside this release

Authenticated agent API, direct folder integration, reminders, diagnostic quizzes, advanced analytics, and richer revision automation are later work. No embedded media/document readers, raw resource hosting, in-app AI billing, automatic grading/completion, collaboration/marketplace, native apps, PWA/service worker/offline shell, or telemetry by default.

## Current blockers and next action

- Live service: a 2026-10-11 DNS lookup returned addresses, but the HTTPS auth health check still failed with "No such host is known". Service availability is not verified; no successful API/auth request is claimed.
- Email delivery: owner-managed provider/domain and SMTP/Management API credentials are still needed; no credentials belong in this file.
- Migration: existing unrelated React edits must be coordinated, and the architecture transition is a proposal pending implementation decisions.
- Live account checks, email setup, and cloud migration still require the project's DNS/access to recover; no live project changes have been made.
- All requested local product phases are implemented. Apply all three ordered migrations and deploy roadmap-import, roadmap-mutate and roadmap-account together after owner access/service connectivity recover; verify SMTP/auth, cross-device flows and full accessibility. See docs/BACKUP_REPLAN.md. Root TypeScript errors in unrelated client/src remain; release types pass without changing those files.

## Session log

| Date (Asia/Colombo) | Checkpoint/session | Evidence | Next action |
| --- | --- | --- | --- |
| 2026-10-10 | Project onboarding and preview | Read handoff/source; localhost demo verified; 158 tests passed, lint had 0 errors/1 existing warning. Live signup/sign-in failed with a DNS blocker. | Verify Supabase project availability before live account checks. |
| 2026-10-10 | PRD gap analysis and planning | Compared PRD v1.1 with current source; created phased checklist and repository update instruction. No PRD features implemented. | Await implementation direction, then start phase 1 and contract fixtures. |
| 2026-10-10 | Phases 1/2 foundation checkpoint | Added canonical contract, validator/CLI, fixtures, frozen 76-checkpoint mapping, reversible staging, and reserved application/skill boundaries. Exported/staged local guest backup without changing app data. 191 tests passed; schema/tools typecheck passed; lint 0 errors/1 existing warning. Confirmed URL still fails DNS; no owner credentials available. | Finish blocked live phase-1 checks and coordinate React work; phase 3 needs a separate request. |
| 2026-10-10 | Local commit checkpoint | User authorized committing session work. Scope includes the demo preview, phase 1/2 foundation, checklist, and agent documentation; unrelated React/continue.md edits and private backups are excluded. Auto-push is disabled for this commit. Existing verification results remain current. | Resolve the recorded phase-1 blockers; no push or later-phase implementation requested. |
| 2026-10-10 | Push checkpoint | User subsequently authorized pushing. Foundation commit `b499c4b` was successfully pushed to `origin/main`. Unrelated working-tree edits and private backups remain excluded. | Resolve phase-1 blockers; later-phase implementation still needs a request. |
| 2026-10-10 | Phases 3/4 implementation session | Added owner-scoped SQL migration/RLS, shared-validator Edge import with transactional receipts, revision/schedule/learner storage, and the library UI. Added stable-ID topic/task field diffs, workload comparison, and visible progress mappings; full suite passed (193/193), lint passed with its existing warning, and Vite plus the server bundle built. Earlier local browser smoke imported the Python fixture. Node native realpath raises sandbox EPERM, so commands used a one-off process compatibility override; none was added to the repo. Live Supabase deployment and two-account checks remain blocked by DNS. | Deploy migration/function and verify cloud isolation/device retrieval when Supabase is reachable; learner mutation idempotency remains phase 6. |
| 2026-10-10 | UI integration correction | Added Roadmaps to the original dashboard navigation and embedded the library in its card layout, matched the existing yellow theme, and carried local demo mode through to the embedded library. Dashboard DOM suite passed (88/88), lint passed with the existing warning, and production build passed. Preserved the dashboard HTML's CRLF endings. | When the project DNS recovers, verify live cloud import and account isolation. |
| 2026-10-10 | Roadmaps layout repair | Restored embedded import/sample actions, transparent background, compact yellow/cream styling, content-based shrinking height, and narrow layout. Browser checked empty state, sample preview, archived card and narrow overflow. 194 tests passed; lint 0 errors/1 existing warning; production build passed. | Live cloud deployment/isolation remains blocked; no commit or push requested. |
| 2026-10-11 | Phases 5/6 study and sync checkpoint | Added six yellow-themed study views, task notes/completion/time, mastery/evidence, schedule moves/warnings, graph/list, account-scoped IndexedDB, ordered durable outbox, conflict recovery, validated mutation Edge function and server receipts. Full suite passed 218/218 tests, followed by 23/23 focused study tests after the unread-cache safeguard; lint passed with 0 errors/1 existing warning; targeted roadmap/schema typechecks and production build passed. Browser verified completion/note/15-minute reload recovery, phone navigation and contained overflow, tablet/desktop layout and keyboard graph details, capacity warnings and explicit date overrides (demo dates restored after the check). SQL/Edge live execution and full accessibility audit remain open. | Deploy both migrations/functions and verify cloud isolation, cross-device conflicts and acknowledgements when DNS is restored; complete the accessibility audit. No commit/push requested. |

### Phase-7/8 verification checkpoint — 2026-10-11

Backup/restore, private-by-default replanning snapshots, explicit progress mapping
choices, immutable history, candidate schedule activation, stale-preview checks
and recovery copies are implemented. Real PostgreSQL tests execute all three
migrations, owner RLS, atomic failure/rollback, retry receipts, fresh restored
revisions, split mapping with original notes, and successful/stale activation.
The local demo uses an atomic account envelope and retains old keys for recovery.
Fresh duplication previews restored required coverage and visible overrides.
Roadmap definition export uses the original validated package for the active
content revision; account backup includes every saved schedule and learner record.

The independently distributable skill has intake/source provenance/sequencing/
feasibility/replanning instructions, generated JSON Schema, canonical bundled
validator and fixtures. Its complete build is dist/skills/semassist (ZIP also
provided); the source SKILL.md alone is not the complete distribution. Validation
runs outside the repository without installed dependencies. This verifies the
package/examples, not a live independently installed agent's production flow.

Full suite passed 234/234 across 10 files; final focused library checks passed
4/4 after the target timezone/weekdays controls. Product/schema/tools/server type
checks pass. Lint: 0 errors/1 pre-existing warning. Production build, HTTP hosting
routes/headers/real 404, standard Deno checks for all three functions, bundled
example checks and skill-creator validation pass. CI now runs product types,
PostgreSQL/security tests, production build/hosting, Edge types and skill examples.
Browser verified the notes-free export success state and new library/forms;
phone form content width matched scroll width, and the viewport was reset.
Browser download-event capture stalled, so real UI control exports/restores were
also verified in jsdom. Full live/assistive-technology gates remain unchecked.

| 2026-10-11 | Remaining local phases 7/8 | Shared backup validator, atomic restore, explicit mappings and schedule history; seven actual PostgreSQL cases, four real library control cases; full 234-test suite and release checks passed. Yellow UI retained. No cloud writes/commit/push. | Owner Supabase/Vercel/SMTP access and reachable service are needed for live deployment, real account/device flows and final accessibility sign-off. |
