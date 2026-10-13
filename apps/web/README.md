# Roadmap library, study, backup and replanning

Roadmaps remains an embedded feature in the original yellow SEM ASSIST dashboard,
with a direct entry at /roadmaps.html. Its React entry is client/roadmaps; the
static dashboard and unrelated client/src work remain in place.

Use npm run dev and open http://localhost:3000/study-dashboard.html?demo=1, then
select Roadmaps. Demo mode is restricted to localhost/loopback and stores data
only in this browser. Its Synced indicator acknowledges the local transport.

All six study views, offline outbox/recovery, private-by-default replan snapshots,
explicit mappings, backup/restore and saved-schedule activation are implemented.
See [workflows, recovery and deployment](../../docs/BACKUP_REPLAN.md) for the
contract, independent skill installation, exact checks and verification gates.

For live use, apply supabase/schema.sql and ALL THREE ordered migrations:
202610100001_roadmap_library.sql, 202610110001_learner_mutations.sql,
202610110002_backup_replan.sql. Then deploy roadmap-import, roadmap-mutate and
roadmap-account together with supabase/functions/deno.json and its lockfile.
Keep service-role secrets only in Supabase; no admin keys belong in the browser.

The live project is not verified available and owner deployment/SMTP access is
missing. Local PostgreSQL/RLS/transaction checks pass, but real Auth, two-device
sync and all five PRD flows still need live verification. Full assistive-technology
accessibility checks remain open. No cloud changes have been made.
