# Handoff — SEM ASSIST

## Latest checkpoint — 2026-10-10, PRD phases 1/2

The user authorized phases 1/2 from `tasks.md`. Phase 2 now has a shared Zod
v1.0.0 package/entity contract, generated JSON Schema, semantic validation,
`roadmap:validate`/`roadmap:check`/`roadmap:migrate` commands, examples, and 33 new
tests. `npm test` passed 191 tests; standalone schema/tools typecheck passed;
lint passed with the existing warning. See `docs/ROADMAP_CONTRACT.md`.

Phase 1 is partial: staged architecture decision DEC-014; frozen 76-checkpoint
UUID map; pure reversible migration snapshots preserving exact backup bytes,
unknown fields/history, notes, focus, resources, and personal tasks. The guest
preview (zero completed checkpoints) was exported/staged to ignored
`.freebuff/semassist-migration/guest-{backup,staged}-2026-10-10.json`.
No account/database migration was applied. Root install/build paths and legacy
product remain intact; `apps/web`/`skills/semassist` document future boundaries.

Owner confirmed the existing Supabase URL; it still fails DNS. `.env.local`
credentials are absent. Live auth/schema/templates/redirects and cloud inventory
remain blocked. Unrelated React edits were left alone, so relocation/workspace
wiring is deferred. Phase 3 and later have not been authorized. Next action:
finish live phase-1 checks when project access is available; use `tasks.md` as
the authoritative checklist. The older SMTP handoff below is historical.

## Last updated

2026-10-10 21:17 SLST (+0530).

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
