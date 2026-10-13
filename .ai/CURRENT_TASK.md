# Current task

## Active checkpoint — full theme consistency (2026-10-13)

The user asked to remove the remaining yellow components and match the new
paper/charcoal home design. Legacy detail cards, profile/leaderboard, forms,
dialogs and resource canvas now use workspace tokens. Roadmaps library and all
study views use the same palette; the shared theme script loads in its iframe so
the parent light/dark choice carries through. Profile SVG export, semester print
report and 404 page are aligned. Muted track colors replace bright yellow while
retaining track distinction. No data or account behavior changed. Browser checked
profile control spacing, Roadmaps library/study in light and dark, SVG share card,
print report and 404. One default-color unit assertion was updated. The full run
passed 235/236 before that fix; the focused 61/61 unit tests then passed. Build
and lint pass after final edits (one existing lint warning). Committed and pushed as 1d134fb to origin/main, excluding unrelated
client/src, continue.md and private preview artifacts. Next: cloud rollout,
real account/device flows and assistive-technology verification.

## Active checkpoint — home dashboard redesign (2026-10-12)

Heading-font checkpoint (2026-10-12): user selected Space Grotesk instead of
F1 Torque. Headings and the wordmark now use local Space Grotesk in the static
dashboard and embedded Roadmaps app. DM Sans body/navigation and 1.2× sizing
remain. Font file/OFL license live in client/public/fonts; the dashboard preloads
the heading font and Roadmaps CSS references that same public asset. No new
dependency or data/JS changes. Browser confirms Space Grotesk loaded/computed
on home/track/detail/library headings, DM Sans body/nav and no 360px/default
page overflow. 236 tests, final build and lint pass (one existing warning).
Evidence: .freebuff/home-space-grotesk.png. No commit, push or deployment.

User supplied the ATHENAEUM reference and authorized a full visual overhaul,
starting with home. This supersedes the earlier yellow-theme constraint for home.
The static HTML now has a charcoal sidebar, compact toolbar, paper overview,
learning-track gallery, real checkpoint queue/focus log/history/resource shelf,
and selectable study inspector. Data and auth flows are unchanged; old anchors
and controls remain. Styling is in client/public/workspace.css with a locally
licensed DM Sans font and Lucide sprite; no new runtime dependency.
renderHomeWorkspace projects existing legacy study data (not imported Roadmap
learner data), with no new storage. The embedded Roadmaps app stays functional.

Latest readability correction (2026-10-12): user found the 2× version too large
and requested 1.2× the original size. DM Sans is retained. HTML/workspace text
sizes were reduced to 60% of the 2× sizes, exactly 1.2× the original; the large
layout overrides were removed and compact columns/controls restored. Queue and
entry wrapping and hidden guest sign-out chrome remain. Local DM Sans/font license
are unchanged. Browser confirms 14.4px nav, 13.2px labels and no default/360px page
overflow or overflowing phone summary cells; 1170px inspector layout also fits.
All 236/236 tests, build and lint pass (one existing warning). New evidence:
.freebuff/home-120.png. No data/JS behavior changes, commit or deployment.

Browser checks: 1170px/1400px desktop and 390px/360px phones, no page overflow,
track selection/opening, task-form focus, profile/share/pulse access and both
themes. All 236/236 tests in 10 files pass; final build and lint pass (one existing
warning). Initial CLI timeout passed with lower concurrency; a test-only jsdom
scroll mock was corrected. Evidence: .freebuff/home-redesign.png. Next checkpoint
is matching Roadmaps study screens. The temporary viewport was reset; local
preview is open at http://localhost:3000/study-dashboard.html?demo=1#overview.
No commit, push or deployment. Previous cloud/SMTP/accessibility gates remain open.

## Active checkpoint — remaining PRD phases 7/8 (2026-10-11)

User authorized completing the remaining work. Local phases are implemented:
versioned account Roadmaps backups, separate validated merge/replace restore,
pre-restore downloads/private server receipts, authoritative stale-preview CAS,
explicit mapping decisions, removed-task history, all saved schedules and atomic
activation. Snapshots exclude private notes/evidence by default and include the
baseline, mastery, target duration/minutes/date/timezone/weekdays. Duplication
restarts required coverage through a visible preview with explicit warnings.
The original yellow static dashboard remains, with its own legacy export/import.

The independent skill is built at dist/skills/semassist, with bundled canonical
validator/schema/examples/licenses/workflow docs; dist/semassist-skill.zip is the
shareable distribution. Release CI adds product/server/schema types, actual
PostgreSQL/RLS/transaction tests, build/hosting, Deno function types and skill checks.
Root check still reports unrelated client/src work, which was not edited.

Verification: full 234/234 tests (10 files), then focused library 4/4 after target
controls; product types pass, lint 0 errors/1 existing warning, production build
and HTTP routes/security/404 pass, all three Edge function types pass, independent
skill/examples validate. Browser preserved yellow styling, exported a notes-free
snapshot success state, and showed no phone-form horizontal overflow. Browser
export-event capture stalled; jsdom validates actual library download/restore
controls. Full WCAG assistive-technology and live auth/device flows remain open.

No production deployment, commit or push. DNS lookup returned addresses on
2026-10-11, but HTTPS auth health still failed to resolve; service availability
is unverified. No Supabase Management or Vercel deployment login/owner SMTP keys
were found. Apply all three migrations and deploy roadmap-import, roadmap-mutate
and roadmap-account together when owner access/connectivity are available, then
verify the five live PRD flows and full accessibility. See tasks.md and
 docs/BACKUP_REPLAN.md. Unrelated client/src and continue.md edits remain untouched.
## Earlier checkpoints and SMTP handoff (historical)

**Latest planning checkpoint (2026-10-10):** Read PRD v1.1, compared it against source,
and created `tasks.md` with phased checklists, checkpoint criteria, blockers, and a
session log. `AGENTS.md` now requires updating it after every checkpoint/session.
PRD implementation is not started or authorized by the planning/checklist requests.
The prior auth objective and its live DNS/owner-credential blockers remain below.
Next planning action: await implementation direction, then start phase 1; contract
fixtures can be developed independently once implementation is authorized.

**Objective:** Set up a transactional email provider so Supabase confirmation, resend,
and password-reset emails are actually delivered.

**Status:** Blocked — repository work is complete; the remaining steps need the
project owner's accounts and credentials.

**Relevant files**

- `scripts/configure-auth-smtp.mjs` — the Management-API SMTP configurator (dry run unless `--apply`)
- `.env.example` — owner-side variable template (`.env.local` is git-ignored)
- `package.json` — `smtp:configure` script (`node --env-file-if-exists=.env.local …`)
- `continue.md` — "Configure custom SMTP through a transactional email provider"
- `client/public/study-dashboard.js` — `authErrorMessage`, `resendConfirmationEmail`, `setResendVisible`
- `.github/workflows/ci.yml` — unrelated but committed in the same session

**Completed**

- Diagnosed the failure: Supabase's built-in mailer delivers only to project-team
  addresses at 2 messages/hour, so `POST /auth/v1/signup` answers 500
  `{"error_code":"unexpected_failure","msg":"Error sending confirmation email"}` and no
  account is ever confirmable. Custom SMTP is a project-owner Management API change.
- Chose Resend and wrote `scripts/configure-auth-smtp.mjs`: parses `--apply`,
  `--provider resend|generic`, `--help`; validates every variable (`SMTP_SENDER_EMAIL`
  by regex, `SMTP_PORT` numeric); prints the planned body with `smtp_pass` redacted;
  PATCHes then GETs the config back and prints it; sets `process.exitCode` rather than
  calling `process.exit()` after live requests (a Windows libuv assertion turned a
  correct exit 1 into 127).
- Wrote `.env.example`, added `smtp:configure`, and documented the whole path in
  `continue.md`, including the 30 msg/hour throttle and the stranded-unconfirmed-accounts
  note.
- Made the npm script load `.env.local` itself (`--env-file-if-exists`) so the documented
  copy-paste flow works verbatim.
- Added `.github/workflows/ci.yml` (install → lint → test) and committed the trailing
  dark-mode/status-colour fix from the change-password review.
- Verified: script exit codes 0/2/2/0/2/1 across help, missing env, unknown flag, unknown
  provider, bad port, dry run, and a 401 `--apply`; eslint clean on the script; the suite
  at 156/156; both commits pushed (`f8fc233`, `0762781`).
- Committed and pushed as `f8fc233` and `0762781` (the auto-push hook published them).

**Remaining**

1. Owner action: verify a sending domain at https://resend.com/domains and create an API
   key; create a Supabase Management API token.
2. Put `SUPABASE_ACCESS_TOKEN`, `RESEND_API_KEY`, and `SMTP_SENDER_EMAIL` in `.env.local`.
3. Run `npm run smtp:configure -- --provider resend` (dry run), then `… --apply`.
4. Confirm the read-back shows the new `smtp_host`/`smtp_user` and `mailer_autoconfirm`
   is still `false`.
5. Verify end to end by signing up with a real address and watching the send appear in
   the provider's dashboard.
6. Optional follow-up: tell owners of accounts created while the mailer was down to use
   the sign-in form's **Resend confirmation email** button, or reset their password.

**Issues/blockers**

- The Resend account, domain verification, and tokens are the owner's; they cannot be
  created from the repository (Resend has no provisionable service path).
- Live verification was impossible from this environment: the Supabase project host
  `nrxbelpmydquivcphxry.supabase.co` failed to resolve (`ENOTFOUND`) for both `curl` and
  `node fetch`, while `api.supabase.com` and `esm.sh` resolved fine.
- The GitHub Actions run was never observed (`gh` is not installed and no token is
  available); only the individual steps were reproduced locally.
- Unrelated known-red check: `npm run check` (tsc) fails in `client/src/**`.

**Next action:** wait for the owner's `RESEND_API_KEY` and `SUPABASE_ACCESS_TOKEN`, then
run the dry run and `--apply` and read the config back.

**Live preview check (2026-10-10):** Started Vite at http://localhost:3000/ and tested signup and sign-in through the real preview form using the owner-supplied demo email. Both showed "Failed to fetch"; account creation and a successful session could not be confirmed. An unsandboxed Resolve-DnsName check for the configured Supabase host returned "DNS name does not exist". Before retrying email delivery, the owner needs to verify the Supabase project's availability and current project URL; SMTP credentials alone will not resolve this connection failure.

**Local dashboard preview (2026-10-10):** Added `?demo=1` on localhost/loopback origins to open the guest dashboard directly and skip Supabase initialization. The preview is open at http://localhost:3000/study-dashboard.html?demo=1. Guest progress uses existing local storage; account controls stay hidden, and deployed origins still require authentication. The live Supabase DNS blocker remains unresolved.

## Roadmaps layout repair — 2026-10-10

Fixed embedded root/body transparency, restored Import JSON and sample actions,
matched compact yellow/cream dashboard controls and cards, and removed the fixed
520px blank region. ResizeObserver now measures the content root so the iframe
can grow and shrink without measuring its own viewport. Embedded content no
longer enforces a 320px minimum inside narrow dashboard cards. Added a trusted
resize/shrink regression test. Verified empty library, Python import preview,
and existing archived card in browser; narrow content width equals scroll width.
Full suite: 194/194; lint: 0 errors/1 existing warning; production build passed.
Tests/build used a temporary process-only realpath compatibility shim for sandbox
EPERM. No cloud writes, commit, or push. Next: live cloud deployment/isolation
checks remain blocked as recorded above.
