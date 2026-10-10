# SEM ASSIST — Agent Handoff

## Project status

This is a Vite/React project, but the user-facing product is currently a self-contained dashboard at `client/public/study-dashboard.html`. `client/src/pages/Home.tsx` immediately redirects the root React route to that static page. For feature work on the dashboard, edit the static HTML file rather than the React components.

Git is fully usable: the repository lives at `github.com/SujayYadav776/SEMASSIST` and `main` tracks `origin/main`.

## Main files

- `client/public/study-dashboard.html` — primary app: styling, layout, dashboard data, authentication UI, resource canvas, and all client-side behavior.
- `client/public/supabase-config.js` — Supabase project URL, publishable key, and the local development authentication callback URL.
- `supabase/schema.sql` — database table and Row Level Security policies that must be run once in the Supabase SQL Editor.
- `client/src/pages/Home.tsx` — React entry route that redirects to `/study-dashboard.html`.
- `server/index.ts` and `vite.config.ts` — development/build serving configuration.

## Branding and UI

- Product name: **SEM ASSIST**.
- Dashboard greeting: **Welcome in.** by default — the visitor's name (and semester) are editable profile fields persisted in state; no identity is hardcoded.
- Brand logo is a minimal yellow rounded-square `S` monogram defined with `.brand-mark` CSS.
- The visual style uses a pearl-gray background, warm yellow highlight, dark charcoal text, and rounded cards.

## Dashboard features

### Checkpoints

The `tracks` array in `study-dashboard.html` defines all standard checkpoint tracks:

- Python
- 30 Days of Python
- Java
- OS / Linux
- Algorithms
- CampusOps

The **30 Days of Python** track has 30 individually tickable tasks. Its topics follow Asabeneh Yetayeh’s `30-Days-Of-Python` GitHub repository.

Task completion drives:

- Overall progress and per-track progress.
- Activity calendar and streak.
- Weekly rhythm chart.
- Completion counts and local proof-point metrics.

Task IDs are derived from the track id and zero-based task index plus one (for example, `python30-1`). Do not reorder existing tasks without considering that stored completion state is keyed by these IDs.

### Weekly rhythm

The Weekly rhythm card is data-driven. `renderWeeklyProgress(state)` renders Monday–Sunday bars from `state.activity`, highlights today, and shows the week’s completion total.

Dates must continue to use `dateKey()` / `todayKey()`, which produce local-date keys. Do not revert to `toISOString().slice(0, 10)` directly: that caused date shifts in non-UTC time zones.

### Personal tasks

Users can add custom tasks with a cadence of Today or This week. These are part of totals and activity tracking.

### Resource canvas

The Resources nav button targets `#resources`. The Resource canvas lets users save a name, HTTP(S) URL, and short note.

- Each saved resource is a draggable card.
- Card position is saved as `x` and `y` in the resource object.
- `validResourceUrl()` only allows `http:` and `https:` URLs.
- Resource state is stored in `state.resources`.
- Keep the drag interactions working for mouse and touch (`pointerdown`, pointer capture, pointer move/up).

The Python-card whitespace issue was fixed by setting `.checkpoints { align-items: start; }`; retain this so shorter cards do not stretch to match the 30-day track.

## Data model

The dashboard state is a JSON object. The current default shape is:

```js
{
  completed: {},
  completedAt: {},
  activity: {},
  customTasks: [],
  resources: []
}
```

`normalizeState()` keeps older saved state compatible by ensuring `customTasks` and `resources` are arrays.

## Supabase authentication and cloud saving

Authentication is implemented through the Supabase JavaScript client imported from `https://esm.sh/@supabase/supabase-js@2` inside the static dashboard.

Configured Supabase project:

- URL: `https://nrxbelpmydquivcphxry.supabase.co`
- Public/publishable key: stored in `client/public/supabase-config.js`
- Redirect URL: derived from `window.location.origin` + `/study-dashboard.html` in `supabase-config.js` (localhost in dev, deployed origin in production)

Do not add a Supabase `service_role` key to the client or repository. The configured publishable key is intended for browser use and depends on Row Level Security.

The login UI supports email/password sign-up, email confirmation, sign-in, and sign-out. `applySession(user)` loads the current user’s `study_progress` record. The initial local state is uploaded on first sign-in if no cloud record exists.

### Weekly leaderboard

The board lives in the Weekly rhythm card (`#leaderboardBlock`) and only renders for signed-in users; it hides itself while signed out or when `weekly_points` is unreachable (for example before `supabase/schema.sql` has been applied once).

- `weekly_points` has one row per `(user_id, week_start)`. `week_start` is the caller's **local Monday** — the same Monday–Sunday week the weekly rhythm chart and `weeklySeries()` bucket by — so a checkpoint ticked on Monday morning counts in the week the chart shows. `weekStartKey()` computes it locally, awards send it as `earn_points.p_week_start`, and the board reads it back with the same key; keep those in step.
- `earn_points` validates `p_week_start`: it must be a Monday within one week of `date_trunc('week', now())::date` (time zones span UTC-12…UTC+14, so a legitimate local Monday is the UTC week start or exactly one week either side). `NULL` falls back to the UTC week; anything else raises. A tampered key therefore cannot write points into an arbitrary week.
- Award rules: +10 per verified checkpoint, −10 when a checkpoint is unverified, +1 per focused minute. Awards are fire-and-forget (`awardPoints`) and never show an error toast — they are independent of the toasting progress save.
- Rows with `points <= 0` are filtered out of the board, so a user with no points this week sees the “be the first” empty state even after saving a nickname. When `weekly_points` is unreachable the same empty state renders, but the week label still shows.
- The board header names the span it covers (`#leaderboardWeek`, e.g. `Sep 14–20`) so the week is stated rather than implied by “this week”. `weekRangeLabel(weekStartKey())` renders it, abbreviating the end month too when a week straddles a month boundary (`Sep 29–Oct 5`), and returns an empty string for an unparseable key rather than printing `NaN`.
- `scheduleLeaderboardRefresh` pins the `document` it was queued for and skips the refresh if the global has been replaced since. In the browser the document never changes; the guard stops a debounced refresh outliving its page, which in the jsdom suite meant one test's pending timer writing its board into the next test's DOM.
- Nickname contract for `earn_points.p_display_name`: `NULL` leaves the stored name untouched (so earning points never wipes it), while any explicit value — including `''` from clearing the input — replaces it. The client sends `null` from point awards and an explicit string from the nickname save button; `tests/helpers.ts` mirrors the same rule in the fake Supabase client.

Because the week is the viewer's local one, two users in different time zones can be looking at adjacent week buckets near a boundary; that is intentional and matches the per-viewer weekly rhythm chart.

### Auth wiring rules

- `supabase.auth.onAuthStateChange` must stay **synchronous** and must never make a Supabase call inside the callback. supabase-js holds its auth lock while dispatching, and a Supabase call made in there deadlocks the client (Supabase troubleshooting: "Why is my supabase API call not returning?"). The handler therefore defers `applySession` with `setTimeout(…, 0)`, and `tests/dashboard-unit.test.ts` pins that with a source guard.
- The listener is subscribed **before** the boot session is applied, so a slow or failed initial apply cannot leave the page deaf to later sign-ins. The deferred apply is pinned to the document it was queued for, so it can never run against a page that replaced this one.
- The form submit applies the returned session directly instead of waiting for the event; `applySession` coalesces concurrent applies of the same user into one cloud read, so the two delivery channels cannot race.
- `init()` captures `window.location.hash` **before** the Supabase client initialises: supabase-js parses the fragment for a session on first use and clears it, so reading it afterwards is a race. The confirmation overlay and the recovery detection both use that captured value.
- While `passwordResetPending` is true, `showSignedInChrome` keeps the auth screen up even though the recovery link has already signed the user in — the card must not be swapped out for the dashboard mid-reset.

### Password reset

The sign-in form's **Forgot password?** (`#authForgot`) covers the cases the confirmation email cannot: a lost password, and an account whose confirmation mail never arrived (a recovery link carries its own session, so it works whether or not the address was ever confirmed). It requires an email in the field, calls `auth.resetPasswordForEmail(email, { redirectTo })`, and is deliberately worded so it neither confirms nor denies that the address has an account.

The email lands back on `/study-dashboard.html#access_token=…&type=recovery`, which switches the auth card into a third mode (`beginPasswordReset`): the email field is prefilled from the link's session and disabled (a disabled field is also skipped by form validation, so it cannot block submission), the password field becomes **New password**, and the switch/resend actions are hidden. Submitting calls `auth.updateUser({ password })`, clears the single-use fragment via `clearUrlHash()`, and reveals the signed-in dashboard the link already earned.

Both entry points are wired: the fragment on arrival, and the `PASSWORD_RECOVERY` auth event (handled before `applySession` in the deferred callback so the card is up first). An expired or reused link surfaces as "That reset link has expired or was already used" through `authErrorMessage`.

### Change password (authenticated)

Signed-in users rotate a password from the profile card (`#changePasswordOpen`), so no email is involved — this is the flow that still works while the project's mailer is down (see the SMTP note below).

- The action is inside the profile card (`#profileSecurity`) and its visibility is set only by `showSignedInChrome`, the same place that toggles the auth screen and sign-out button, so it can never show for a guest. When the session ends, `showSignedInChrome` also closes the dialog.
- The dialog (`#passwordOverlay`) reuses the import overlay's `import-overlay` / `import-card` shell (and `import-field`, `import-error`, `import-actions`), so it inherits that chrome; the shared `.import-card` also gained dark-theme rules (and `.import-save` joined the fixed-dark-ink-on-yellow group), which fixes the import dialog's dark-mode appearance and its previously white-on-yellow action button.
- `saveChangedPassword()` mirrors `saveNewPassword()`: a 6+ character guard, then `auth.updateUser({ password })` against the open session. It additionally requires the confirmation field to match, and clears both fields on close (success, Cancel, Escape, or backdrop) so a typed password never lingers in the DOM.
- Errors go through `authErrorMessage`, except the expired-session case: a signed-in user is told to sign in again rather than being pointed at "Forgot password", which would hunt for an email this flow deliberately avoids.
- The global keyboard-shortcut handler treats the open dialog like the journal/report/share overlays (`if (!passwordOverlay.hidden) return`) so `j`/`k`/`t`/`/` cannot act on the dashboard while it is up. Typing inside the fields is separately guarded by the existing `input, textarea, select` check.

### Git workflow
- Commits auto-push to `origin` via a local `.git/hooks/post-commit` hook (keeps GitHub's contribution graph current).
- Fresh clones: run `pnpm hooks:install` (or `sh scripts/install-autopush-hook.sh`) once to install it; the canonical hook lives at `scripts/post-commit`.
- To commit without pushing, set `GIT_AUTOPUSH_OFF=1` for the commit command.

## Required manual Supabase setup

The public key cannot create schema or modify Supabase settings. Before authentication and persistence work end-to-end, a project owner must:

1. Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor.
2. Enable Email authentication in Supabase Dashboard → Authentication.
3. In Authentication → URL Configuration, set:
   - Site URL: `http://localhost:3000` for local development (and `https://semassist.runs-on.dev/study-dashboard.html` for production).
   - Redirect URL: `http://localhost:3000/study-dashboard.html` and `https://semassist.runs-on.dev/study-dashboard.html`.
4. `supabase-config.js` derives `redirectUrl` from `window.location.origin`, so no code change is needed between environments — just ensure every deployed origin is allowlisted in Supabase's URL Configuration.

#### Applying custom SEMASSIST email templates

Supabase sends branded emails for sign-up verification, magic links, and password resets. Custom templates live in `supabase/email-templates/` and must be pasted into the Supabase dashboard manually (the public key cannot update them).

How to apply (one time, project owner only):

1. Go to https://supabase.com/dashboard → **Authentication** → **Email Templates**.
2. For each template type, open the corresponding file from `supabase/email-templates/`:
   - **Confirm sign up** → paste contents of `confirm-signup.html`
   - **Magic Link** → paste contents of `magic-link.html`
   - **Reset Password** → paste contents of `reset-password.html`
3. Click **Save** for each template.
4. The templates use Supabase's `{{ .ConfirmationURL }}` variable, which is automatically replaced with the verification link.

The templates follow the SEMASSIST Design System (`DESIGN.md`, `design-system.css`):
- **Fonts**: Space Grotesk (display/headings) + Inter (body)
- **Colors**: seed tokens `--primary: #F4C645`, `--ink: #1E1E1E`, `--surface: #FFFDF6`, `--border: #E8E2D2`
- **Radius**: 24px cards, pill buttons (`999px`)
- **Shadows**: L1 card shadow `0 18px 40px rgba(fg,.10)`
- **Components**: CTA uses `.cta` (pill, ink bg, ink-fg text, hover lift); icons use `color-mix()` tinted backgrounds for success/info/warning states
- Responsive design for mobile email clients

After applying, test the full flow: sign up with a new email → check inbox for the branded SEM ASSIST email → click the confirmation link → the dashboard shows a brief "Email verified" overlay before loading your dashboard.

#### Sign-up fails with "Error sending confirmation email"

Observed in this project: `POST /auth/v1/signup` returns **500** with the body `{"error_code":"unexpected_failure","msg":"Error sending confirmation email"}`, and `GET /auth/v1/settings` reports `"mailer_autoconfirm": false`. That combination is fatal and has nothing to do with the page: email confirmation is required, but the project cannot send the email, so no account is ever confirmable and sign-in can only answer `invalid_credentials` (or `email_not_confirmed` for a half-created account). The sign-up code path itself is fine.

A project owner fixes it either way:

1. **Configure custom SMTP** (recommended — it keeps the confirmation step). See the next subsection.
2. **Or turn confirmation off** — Authentication → **Sign In / Providers** → Email → disable **Confirm email**. `signUp` then returns a session immediately and the dashboard signs the user in with it, so no mail is needed at all. After the change, `GET /auth/v1/settings` should report `"mailer_autoconfirm": true`.

#### Configure custom SMTP through a transactional email provider

Custom SMTP is how Supabase Auth delivers its own mail: the provider hands you an SMTP host, port, username and password, and Supabase sends through it. **Resend** is the pick here — Supabase's own guide lists it first, it publishes a first-party Supabase walkthrough, and its free tier covers a study dashboard. Anything that speaks SMTP also works (Postmark, SendGrid, Brevo, Mailjet, AWS SES …) through the `--provider generic` path.

Resend exposes one fixed server (`smtp.resend.com`, username `resend`, port 465 = implicit SSL/TLS), so the only secret is the API key — and that key *is* the SMTP password.

Prerequisites, in order:

1. **Verify a sending domain** at https://resend.com/domains (add the DKIM/SPF DNS records it shows). Without a verified domain Resend only allows `onboarding@resend.dev` as the From address and only delivers to the account owner's own inbox, which is useless for real sign-ups.
2. **Create an API key** at https://resend.com/api-keys.
3. **Create a Supabase Management API token** at https://supabase.com/dashboard/account/tokens.
4. Put the values in `.env.local` (see `.env.example`) and apply them:

```bash
npm run smtp:configure -- --provider resend            # dry run: prints the change
npm run smtp:configure -- --provider resend --apply    # writes it
```

`scripts/configure-auth-smtp.mjs` performs the Management API call Supabase documents (`PATCH /v1/projects/<ref>/config/auth`), then reads the config back and prints it so you can see it took. It is a dry run unless `--apply` is passed, it redacts the password from everything it logs, and it deliberately does **not** send `mailer_autoconfirm`, so it can never silently change your confirmation policy. The same thing by hand: **Authentication → Emails → SMTP Settings**, then Sender email, Sender name, and the host/port/user/password.

Two things that surprise people afterwards:

- A project on custom SMTP is throttled to **30 messages/hour** until you raise it in **Authentication → Rate Limits**.
- Supabase's built-in mailer only ever delivered to project-team addresses, so accounts created while it was broken may sit unconfirmed. Those users need the confirmation email resent before they can sign in — the sign-in form's **Resend confirmation email** button is exactly that retry.

Diagnose any future auth failure the same way, without the UI:

```bash
curl -s "https://<project-ref>.supabase.co/auth/v1/settings" -H "apikey: <publishable-key>"
```

The dashboard maps the causes it can name to actionable copy (`authErrorMessage`), including a signup 5xx (mailer) and `email_not_confirmed`; anything unrecognised is shown verbatim rather than reworded.

If SMTP is fixed later, note that accounts created while the mailer was down may exist unconfirmed — those users need the confirmation email resent (or a password reset) before they can sign in. The sign-in form offers exactly that retry: **Resend confirmation email** (`#authResend`) appears only while an unconfirmed email is the obstacle — after a sign-up that needs confirmation or a sign-in that answers `email_not_confirmed` — and hides again on a mode switch or a new attempt. It calls `auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`, requires an email in the field first, and maps a failure through `authErrorMessage`. Until the mailer is fixed it will keep failing, which is the intended visible signal.

#### Applying the database schema (fixes the cloud-save error)

Running `supabase/schema.sql` is step 1 above, but it is the single most important manual step. Until it is applied, the dashboard's cloud save fails and the user sees a **"Could not save progress. Please try again."** toast on every change; the **Weekly leaderboard** also stays empty. Applying the schema resolves both at once.

How to run it (one time, project owner only):

1. Go to https://supabase.com/dashboard and open the project `nrxbelpmydquivcphxry`.
2. In the left sidebar, open **SQL Editor** and click **New query** (or **+ New**).
3. Open `supabase/schema.sql` and paste its full contents into the editor.
4. Click **Run** (or **▶ Run**). The query is idempotent (tables use `if not exists`, functions use `create or replace`, and every policy is dropped before it is recreated), so re-running it is safe.
5. Confirm the results panel shows success. It should create the `study_progress` and `weekly_points` tables, enable Row Level Security with the per-user policies, and create the `earn_points` function plus its `authenticated` grant.

Smoke-test after applying: sign in on the dashboard and verify a checkpoint tick no longer shows the "Could not save progress" toast, and that the **This week's board** block (Weekly rhythm card) lists real points once you have earned some.

Changes to `schema.sql` (e.g. a new table for a future feature) require re-applying only the new statements — paste the updated file and run it again; existing tables are left intact.

The app must be served over HTTP(S), not opened directly as a `file://` URL, for Supabase email confirmation redirects to work. The in-app browser was observed opening the static file directly, so this caveat remains important.

## Development and verification

Useful scripts from `package.json`:

```text
pnpm dev
pnpm check
pnpm build
```

Dependencies are installed, so `pnpm test` and `pnpm build` run locally and pass.

The inline module script in `study-dashboard.html` has been syntax-checked using:

```powershell
$html = Get-Content -Raw client/public/study-dashboard.html
$script = [regex]::Match($html, '<script type="module">\s*(.*?)\s*</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$script | node --input-type=module --check
```

## Working conventions

- Use `apply_patch` for edits.
- Preserve user changes and avoid destructive Git commands.
- Keep all browser-visible strings and HTML in `client/public/study-dashboard.html` consistent with SEM ASSIST branding.
- Avoid storing secrets in public files. The current Supabase key is publishable and is acceptable; never expose privileged credentials.
- Test interactions through a served local URL when possible. Direct `file://` use will not fully exercise Supabase authentication.
