# Roadmap contract v1.0.0

The canonical schema is `packages/roadmap-schema/src/schema.ts`, using the already
installed Zod 4 dependency. `validate.ts` adds cross-record semantics. Browser,
server, and the future companion skill must use this same validator. The current
dashboard is not yet connected to the new package format.

## Commands

```powershell
npm run roadmap:validate -- examples/beginner-python.json
npm run roadmap:validate -- --json-schema
npm run roadmap:check
npm run roadmap:migrate -- examples/legacy-progress.json .freebuff/semassist-migration/staged.json
```

Create the output directory before staging. The migration command refuses to
overwrite an existing output file. It never changes dashboard or cloud data.
Keep actual learner backups/staging in the ignored `.freebuff/semassist-migration/`
directory; `examples/legacy-progress.json` is synthetic data.

## Identity and ownership

- IDs are UUIDs generated once, not titles, indices, dates, or URLs. They survive
  edits and schedule changes. Package/roadmap/content/entity IDs are distinct;
  repeated references are permitted, duplicate definitions are rejected.
- Content revisions contain topic/task/resource/milestone definitions. Schedules
  reference a content revision. New duration means a new schedule ID. A deliberate
  review has its own task ID and checkbox, not another assignment of the same task.
- Imported packages cannot carry account ownership, learner progress, notes,
  mastery, credentials, or executable fields. Descriptive strings are plain text
  and must be escaped by the future UI, not rendered as HTML.
- Separate schemas define dashboard progress, notes, mastery, manual study time,
  milestone evidence, and mutations. A completed record requires a UTC timestamp;
  an incomplete record has no completion timestamp.
- Server operations in phase 3 must derive ownership from auth, verify baseline
  IDs/learnerRevision/completedTaskIds against stored data, compare immutable
  content for schedule-only imports, and transact revision changes. Validation
  alone cannot prove ownership or the truth of a claimed baseline.

## Dates, schedules, and validation

- Version 1.0.0 is currently the only supported package version. Other versions
  fail explicitly. There are no historical roadmap package versions to migrate;
  the separately versioned legacy migration is the supported old-state path.
- Event timestamps use ISO UTC `Z`; study dates are valid local ISO date strings.
  Each schedule has an IANA timezone. Date-only arithmetic uses UTC internally to
  avoid daylight-saving shifts; it does not turn study dates into UTC event times.
- Weekdays are Monday=1 through Sunday=7. `length` is positive and bounded to
  3660 days. `total` is the full candidate program window. `additional` is an
  extra window starting at `startDate` and requires a prior-plan baseline.
- With `calendar-days`, offset 0 means the start date, and length includes rest
  days. With `study-days`, offset 0 means the first eligible study day on/after
  start; offsets skip rest days. An assignment contains either `date` or
  `dayOffset`, never both, and must land within the eligible schedule dates.
- Required new/incomplete tasks must be assigned. Verified completed baseline
  tasks may be omitted from a revised schedule. Optional tasks may be unassigned.
- Learning prerequisites, including transitive prerequisites, must be learned
  on earlier dates or present in verified baseline completion. Version 1 has no
  intraday sequence field: same-day prerequisite learning needs an explicit
  `overrideReason`. Explicit review tasks are exempt from learning-order checks.
- Work above daily capacity is rejected unless that date has a nonempty
  `workloadOverrides` reason. Accepted overrides produce warnings for the preview.
  The UI must show warnings before confirmation; the validator does not activate
  imports or infer learner completion/mastery.
- Milestone definitions reference existing tasks/topics. Each schedule owns its
  `milestonePlacements` dates, so moving milestones during replanning does not
  change the immutable content revision.
- Resources need HTTP(S) URLs or bibliographic references. Access status, locator,
  provenance, limitations, and confidence are explicit. An unaccessed source
  cannot claim an access timestamp. Fixtures do not claim to have analyzed sources.
- `parsePackageJson` enforces a configurable UTF-8 byte limit, default 5 MiB,
  before parsing. The CLI also checks file size before reading. Future upload
  endpoints must bound request bodies before buffering and use this parser.
- JSON Schema is derived on demand. It covers structural rules; dependency
  graphs, references, schedule feasibility, and baseline rules require the shared
  runtime validator. JSON Schema-only validation is insufficient.

## Legacy preservation and recovery

`legacy-task-map.json` freezes all 76 current checkpoint IDs, labels, track IDs,
and their new UUIDs. Tests pin the mapping against the current track definitions.
Never regenerate these IDs once learner data is migrated.

`prepareLegacyMigration` accepts current v3 backups or raw v3 state and returns a
staging snapshot. It retains the exact original JSON bytes plus the entire state,
including personal tasks, resource positions, reviews, focus notes/totals, profile,
and unknown extension fields. Unknown checkpoint IDs remain unmapped history for
review. Legacy completion dates retain their date-only meaning; no completion
timestamp or mastery is invented. `restoreLegacyBackup` returns the original JSON
unchanged for use with the existing dashboard import.

This is a reversible preparation format, not a new account backup or an applied
database migration. v1-era migration remains the existing dashboard's
`migrateLegacy` path; export its normalized v3 state before using this tool.
Actual account migration and transactional restore are later phases.

## Current verification boundaries

The local guest preview was exported before any migration. Cloud data inventory,
RLS, email templates, redirect settings, and two real accounts remain unverified:
the owner-confirmed project URL has a DNS failure, and no `.env.local` owner
credentials exist in this checkout. No cloud configuration was changed.
