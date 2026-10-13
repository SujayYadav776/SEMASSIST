# Backup, recovery and replanning

The original yellow dashboard remains the home page. Roadmaps is an embedded
feature, also available at `/roadmaps.html`. Demo mode is restricted to localhost
and loopback hosts; deployed pages use Supabase authentication.

## Files and privacy

Library **Export** downloads definitions without learner records.
**Back up account** downloads `semassist-backup`, version 1: every Roadmap in this
account, including archived plans, immutable content history, saved schedules,
active pointers, completion timestamps, notes, mastery, milestone evidence,
study time and assignment overrides. Keep private backups safe. This covers the
account's *Roadmaps* data. Original dashboard tracks/profile/focus/resource data
still use **Export progress** / **Import progress** and reversible legacy staging.

Study Settings has a separate recovery export with acknowledged records and
pending/conflicting outbox edits. It cannot be passed to agent import or Restore
backup. Sync/resolve pending edits before an authoritative account snapshot, and
close other study tabs. Local demo allows one editing workspace per account;
cloud allows one per roadmap. There is no offline reload shell or service worker.

## Restore

Choose **Restore backup**. Validation rejects unsupported versions, files over
25 MiB, duplicate IDs, immutable collisions, missing history, dangling records,
unsafe URLs and malformed learner data before writes. Inspect source/destination
accounts, export time, counts and collisions. **Merge** adds missing roadmap IDs
and skips complete colliding plans, including their learner records. **Replace**
replaces all Roadmaps data in the signed-in destination account. Ownership comes
from authentication, never backup.sourceAccount. The destination is confirmed.

A pre-restore file downloads before confirmation. The server also stores and
returns its private prior backup. It compares the authoritative preview under an
account lock; concurrent edits invalidate it. Definitions/records/pointers commit
together or roll back. Restore IDs deduplicate retries. Fresh learner revisions
stop pre-restore devices silently overwriting restored notes. Cache clears after
success; a failure is shown, so keep recovery files and refresh before studying.
Undo using the pre-restore file through another validated Replace preview.

## Replanning and schedule history

Open **Replan & schedules**. Set start date, duration, total/additional meaning,
calendar/eligible-day basis and daily minutes. The snapshot includes timezone,
weekdays, active IDs, authoritative learner revision, completion and mastery.
Private notes and evidence text are excluded by default; opt in to share them.
Give it to the installed semassist skill, then preview its JSON through **Import
JSON**. Review workload, changes, warnings and each explicit carryover choice.
Stale baselines require a fresh snapshot and plan.

Duration-only changes reuse content/task IDs with a new schedule. Revisions name
their predecessor. Substantial task changes need new IDs; split/merge mapping
targets must be new and unique. Completion copies only when every source task is
complete, notes only when selected, and originals remain. New tasks start
incomplete; removed tasks retain history. Combined notes over 10,000 characters
are rejected instead of truncated. Saved schedules can be previewed/activated
with atomic learner/content/schedule baseline checks; prior schedules remain and
task completion stays shared across them.

## Verification and deployment

Run `npm test`, `npm run lint`, `npm run check:release`, `npm run build`,
`node scripts/check-hosting.mjs`, and `npm run skill:build`. Validate both bundled
examples using `node dist/skills/semassist/scripts/validate.mjs <file>`.
Database tests execute real migrations/RLS in embedded PostgreSQL, not live Auth,
SMTP or network sync. Release types cover active Roadmaps, shared contract/tools
and Express. Root `npm run check` remains red on unrelated `client/src` work;
those existing edits have not been changed.

Back up live data first. Apply `supabase/schema.sql`, then the one-time migrations
in order (do not reapply old migrations, which would restore old permissions):

1. `202610100001_roadmap_library.sql`
2. `202610110001_learner_mutations.sql`
3. `202610110002_backup_replan.sql`

Deploy `roadmap-import`, `roadmap-mutate`, and `roadmap-account` together using
`supabase/functions/deno.json` and its lockfile. Standard URL, anon/publishable and
service-role secrets stay in Supabase functions; never in browser code. Direct
learner/pointer writes are revoked. Vercel/Express allow same-origin iframe
embedding, keep restrictive CSP/security headers, support `/roadmaps` and real
404s. Set the HTTPS site URL and auth redirect allowlist to the production host,
preserving dashboard confirmation/reset paths. Owner login/SMTP access is needed.

Before release verify all five PRD flows on two accounts/devices: generate/import,
study/sync, connection recovery/conflicts, 15-to-30-day replan, and backup/restore.
Complete WCAG 2.2 AA with assistive technology, contrast, focus, responsive layout
and keyboard checks. Live/manual gates remain open in tasks.md; no production
deployment is claimed.
