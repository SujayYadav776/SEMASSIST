# SEMASSIST implementation checklist

Last updated: 2026-10-10 (Asia/Colombo)

Source: [PRD v1.1](../SEMASSIST-agent-handoff/PRD.md), dated 2026-10-10.
Status: phases 1/2 authorized on 2026-10-10. Phase 2 is implemented and verified;
phase 1 is partial with live-service and relocation blockers. A local commit of
this session's work is authorized; later phases, deployment, and pushes are not.

## Updating this checklist

- Update this file after every completed checkpoint and at the end of every work session.
- Check an item only after its stated behavior is implemented and verified. Partial work stays unchecked with a short progress note.
- Record validation results, blockers, and the next action below. Distinguish mocked tests from live verification.
- Keep `.ai/CURRENT_TASK.md` aligned; update `.ai/HANDOFF.md` for substantial handoffs.
- Preserve existing learner data and unrelated working-tree edits. Never record credentials here.

## Preparation already completed

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

- [ ] Add versioned database migrations, ownership relationships, integrity constraints, and owner-only RLS.
- [ ] Derive ownership from the authenticated session; never trust account IDs supplied by packages.
- [ ] Apply the shared validator server-side before persistence.
- [ ] Implement atomic import, restore, and schedule-activation operations with baseline revision checks.
- [ ] Add import IDs/content digests and mutation IDs for idempotent retries.
- [ ] Assign authoritative server revisions and enforce conflict checks without device-clock ordering.
- [ ] Verify two-account isolation for reads, writes, imports, restores, and related records.

Checkpoint: invalid operations roll back completely; retries cannot create duplicate data; cross-account access is rejected.

## 4. Roadmap library and import — FR-01/03

- [ ] Build My Roadmaps with search, roadmap switching, title/goals/subject/level, and export.
- [ ] Implement independent duplication with new identity and fresh progress.
- [ ] Implement reversible archive and explicitly confirmed deletion with consistent related-record handling.
- [ ] Add JSON file upload and client validation feedback.
- [ ] Preview new roadmaps versus revisions, topic/task changes, workload, and proposed progress mappings.
- [ ] Persist only after confirmation; cancellation changes nothing.
- [ ] Import a beginner Python fixture and retrieve it under the same account on another device.

Checkpoint: one valid package creates one usable roadmap; failed/canceled imports preserve existing data.

## 5. Study views and task workflows — FR-04/05/07/10

- [ ] Implement Overview, Roadmap, Schedule, Resources, Progress, and Settings routes.
- [ ] Add roadmap switcher, desktop sidebar/breadcrumb, and adaptive phone navigation.
- [ ] Show today's tasks, next unfinished task, upcoming milestone, and compact progress.
- [ ] Build task detail with instructions, objective, type, estimated time, criteria, resource references, note, and completion/reopen controls.
- [ ] Add daily/weekly schedule grids, workload totals, practice/review/catch-up sessions, and keyboard/touch date moves.
- [ ] Warn on workload/prerequisite violations without silently replanning.
- [ ] Implement dependency list and graph with topic details, prerequisites, and associated tasks.
- [ ] Calculate required completion correctly; exclude optional/inactive tasks and handle an empty required set explicitly.
- [ ] Share completion across schedules within a roadmap; give deliberate review repetitions distinct task IDs.
- [ ] Support external resource links, chapter/page/section/timestamp locators, access status, provenance, and reference-only private/local sources.
- [ ] Render imported content as escaped text; reject unsafe URLs and isolate external tabs. Opening resources never completes tasks.
- [ ] Record completion timestamps, plain-text notes, manual study time, separate topic mastery, and milestone evidence/status.
- [ ] Add account, backup, timezone, theme, and sync settings; retain existing useful features without expanding gamification.

Checkpoint: the Python fixture renders every core study view; task completion and mastery remain independent.

## 6. Durable sync and responsive accessibility — FR-08/10

- [ ] Cache previously opened roadmap data in account-scoped IndexedDB.
- [ ] Persist optimistic changes and ordered outbox mutations with mutation/account/entity IDs, baseline revisions, and payloads.
- [ ] Display synced, pending, offline, conflict, and error states accurately.
- [ ] Retry on reconnect, page focus, subsequent online page load, and manual retry; refresh after writes/focus.
- [ ] Preserve pending records across page closure and deduplicate acknowledgements.
- [ ] Merge independent field/entity changes; surface same-field conflicts and preserve both note versions for user resolution.
- [ ] Warn/export before discarding unsynced work on sign-out/account switch; safely isolate and clear account cache.
- [ ] Show IndexedDB failures and preserve recoverable pending data where possible.
- [ ] Enforce online requirements for initial load/reload, login, uncached roadmaps, imports, restore, and schedule activation.
- [ ] Verify 360px phone, tablet, and desktop layouts, 44px touch targets, keyboard focus, reduced motion, and WCAG 2.2 AA targets.
- [ ] Verify graph/list accessibility and no page-wide horizontal scrolling; graph panning stays inside its region.
- [ ] Verify direct links and refresh on nested routes.

Checkpoint: laptop/phone exchange acknowledged changes; reconnect retries do not duplicate mutations; conflicts are recoverable and caches remain private.

## 7. Backup, restore, and replanning — FR-06/09

- [ ] Provide roadmap-only export, minimal replanning snapshot, and versioned full-account backup with schedules/progress/notes/export timestamp.
- [ ] Exclude personal notes from replanning snapshots by default; include baseline IDs, completion, mastery, and target constraints.
- [ ] Validate restore separately from agent import; preview merge/replace, ID collisions, and unsupported versions.
- [ ] Preserve a pre-restore snapshot/downloadable backup; apply restore transactionally within the authenticated account.
- [ ] Separate content revisions from schedule versions; duration changes reuse stable task definitions.
- [ ] Define total versus additional duration and calendar versus eligible study days explicitly.
- [ ] Preview and activate candidate schedules atomically while retaining the original schedule.
- [ ] Retain unchanged completion; new tasks start incomplete; removed tasks keep history outside the active view.
- [ ] Require explicit split/merge/substantial-change mappings; preserve original notes unless explicitly copied.
- [ ] Reject stale automatic activation and require an updated preview when the baseline changes.
- [ ] Verify 15-to-30-day replanning and full-backup restore round trips with preserved IDs/progress and atomic failure cases.

Checkpoint: replanning never silently overwrites learner records; backup restores definitions, schedules, and progress reliably.

## 8. Companion skill and hosted release — FR-02/10

- [ ] Create independently distributable `semassist` skill instructions with the versioned contract and validator.
- [ ] Collect learner level, goal, minutes, duration/deadline, start date/timezone, study days, and sequencing preference; report assumptions.
- [ ] Analyze supported accessible sources; record access limitations, confidence, provenance, and primary/supplementary references.
- [ ] Deduplicate overlap; classify prerequisite/core/optional/advanced material and offer source-faithful versus optimized sequencing.
- [ ] Produce feasible schedules with practice, revision, catch-up capacity, and milestone criteria; explain workload gaps instead of overpacking days.
- [ ] Generate initial and replanning packages without directly writing learner progress or including admin credentials.
- [ ] Document installation, source limitations, import/replan/backup workflows, migration, and recovery.
- [ ] Resolve theme/density/sign-in/hostname defaults and verify hosting compatibility during implementation.
- [ ] Resolve applicable TypeScript failures, then add typecheck/build and contract/security/integration checks to CI alongside lint/tests.
- [ ] Deploy HTTPS with correct routes, headers, CSP, auth redirects, and verified account storage.
- [ ] Pass all five PRD flows live: generate/import, study across devices, connection recovery, replan, and backup/restore.
- [ ] Verify no acknowledged-progress loss, cross-account exposure, silent mapping, or invisible workload override.

Checkpoint: the hosted release and independently installed skill complete the representative flows together.

## Deferred / outside this release

Authenticated agent API, direct folder integration, reminders, diagnostic quizzes, advanced analytics, and richer revision automation are later work. No embedded media/document readers, raw resource hosting, in-app AI billing, automatic grading/completion, collaboration/marketplace, native apps, PWA/service worker/offline shell, or telemetry by default.

## Current blockers and next action

- Live auth: configured Supabase hostname returned "DNS name does not exist" during the 2026-10-10 preview check; verify project availability/current URL before retrying.
- Email delivery: owner-managed provider/domain and SMTP/Management API credentials are still needed; no credentials belong in this file.
- Migration: existing unrelated React edits must be coordinated, and the architecture transition is a proposal pending implementation decisions.
- Phases 1/2 were authorized and worked on. Next action: obtain project availability/access to finish live phase-1 checks, coordinate React edits before relocation, and begin phase 3 only when requested. Do not apply staging snapshots to live data yet.

## Session log

| Date (Asia/Colombo) | Checkpoint/session | Evidence | Next action |
| --- | --- | --- | --- |
| 2026-10-10 | Project onboarding and preview | Read handoff/source; localhost demo verified; 158 tests passed, lint had 0 errors/1 existing warning. Live signup/sign-in failed with a DNS blocker. | Verify Supabase project availability before live account checks. |
| 2026-10-10 | PRD gap analysis and planning | Compared PRD v1.1 with current source; created phased checklist and repository update instruction. No PRD features implemented. | Await implementation direction, then start phase 1 and contract fixtures. |
| 2026-10-10 | Phases 1/2 foundation checkpoint | Added canonical contract, validator/CLI, fixtures, frozen 76-checkpoint mapping, reversible staging, and reserved application/skill boundaries. Exported/staged local guest backup without changing app data. 191 tests passed; schema/tools typecheck passed; lint 0 errors/1 existing warning. Confirmed URL still fails DNS; no owner credentials available. | Finish blocked live phase-1 checks and coordinate React work; phase 3 needs a separate request. |
| 2026-10-10 | Local commit checkpoint | User authorized committing session work. Scope includes the demo preview, phase 1/2 foundation, checklist, and agent documentation; unrelated React/continue.md edits and private backups are excluded. Auto-push is disabled for this commit. Existing verification results remain current. | Resolve the recorded phase-1 blockers; no push or later-phase implementation requested. |
