# Current task

## Active checkpoint — PRD phases 1/2 (2026-10-10)

User authorized starting phases 1 and 2 in `tasks.md`. Phase 2 is implemented:
shared Zod contract v1.0.0, derived JSON Schema, semantic validation, separate
learner-record schemas, CLI tools, examples, and contract/migration tests.
Phase 1 is partial: DEC-014 records staged architecture adoption, 76 legacy IDs
are frozen to UUIDs, and migration staging retains original backup bytes and
unknown history without applying writes. The local guest preview was exported
and staged privately in `.freebuff/semassist-migration/`; cloud inventory is not done.

Validation: 191 tests passed across 5 files; standalone schema/tools typecheck
passed; lint passed with 0 errors and the existing `vite.config.ts` warning.
No new dependencies, product UI changes, or cloud writes in the phase 1/2 work.
The user subsequently authorized a local commit of this session's changes;
unrelated React/continue.md edits and private backups are excluded, and the
auto-push hook was disabled for that commit. The user subsequently authorized
pushing, and foundation commit `b499c4b` was pushed to `origin/main` successfully.

Blockers: owner confirmed the configured Supabase URL but DNS still returns
"DNS name does not exist"; no `.env.local` owner credentials. Live schema/auth/
email-template/redirect checks and two-account verification remain undone.
Unrelated `client/src` edits remain untouched; actual relocation/workspace wiring
is deferred until that work is coordinated. `apps/web` is a reserved directory,
not a replacement application. Dashboard imports do not use the new contract yet.

Next: resolve project availability/owner access for phase 1; coordinate React
edits before moving files. Phase 3 implementation needs a separate user request.
Read `tasks.md` and `docs/ROADMAP_CONTRACT.md` for the current checklist/semantics.

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
