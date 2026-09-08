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
- Dashboard greeting: **Welcome in, Sujay.**
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

#### Applying the database schema (fixes the cloud-save error)

Running `supabase/schema.sql` is step 1 above, but it is the single most important manual step. Until it is applied, the dashboard's cloud save fails and the user sees a **"Could not save progress. Please try again."** toast on every change; the **Weekly leaderboard** also stays empty. Applying the schema resolves both at once.

How to run it (one time, project owner only):

1. Go to https://supabase.com/dashboard and open the project `nrxbelpmydquivcphxry`.
2. In the left sidebar, open **SQL Editor** and click **New query** (or **+ New**).
3. Open `supabase/schema.sql` and paste its full contents into the editor.
4. Click **Run** (or **▶ Run**). The query is idempotent (`if not exists` / `create or replace`), so re-running it is safe.
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

At the time of this handoff, `node_modules` was absent. Attempting `pnpm check` / `pnpm build` tried to reach the package registry but failed due to sandbox/network access, so full typecheck/build has not been completed in this environment.

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
