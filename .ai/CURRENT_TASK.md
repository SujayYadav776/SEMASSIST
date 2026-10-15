# Current task

## Active checkpoint — login refresh and production deployment (2026-10-15)

Login/account layout now matches the workspace; 27 focused auth checks and production build pass, and lint reports only its existing warning. First production publish made all latest feature/login assets public (HTTP 200 and source matches), but / continued to serve the Vite shell. The production build now copies the static dashboard to dist/public/index.html so root serves the same account screen directly even when filesystem routing precedes rewrites. Artifact parity verified; publishing the root fix next.

## Deployment verification — production behind main (2026-10-15)

Read-only production check: https://semassist.runs-on.dev is reachable over HTTPS on Vercel. Root, study-dashboard.html and study-dashboard.js return HTTP 200, but the HTML/JS differ from the local committed version. workspace-calendar.js, workspace-progress.js, workspace-progress.css and /roadmaps return HTTP 404. The production HTML lacks the latest dashboard features. GitHub Release verification succeeds for c2c644c; public commit-status list and deployments query for that SHA are empty, so there is no recorded Vercel deployment for this commit. Hosting is live, but the latest workspace changes are not deployed. No deployment or configuration changes were made. Next: inspect the Vercel project deployment connection/history and deploy the latest main commit when authorized.

## Commit checkpoint — dashboard workspace features (2026-10-15)

Packaged the accumulated dashboard work for the requested commit: track management/universal search, Projects, Week/Month calendar with drag/drop and unfinished carry-forward, Settings with six palettes/font controls, Progress/Skills and compact aligned dashboard cards, plus shared Heming typography and Roadmaps projections. Latest build/lint checks pass (one existing lint warning); feature-focused checks are recorded above. Visual review remains pending. Unrelated client/src shell changes and local .freebuff files are excluded. User authorized the commit. Next: review the dashboard preview.

## Completed checkpoint — dashboard section alignment (2026-10-15)

Replaced the capped two-column activity grouping with three direct cards: Activity calendar, Skill profile and Roadmap pulse. A shared container-aware grid fills the available width: three columns at 900px, two with full-row Roadmap pulse at 600px, and one below. Radar illustration remains capped at 320px. Overview panel edges now share outer padding/gaps; inspector hugs its contents. Dashboard sections use a 12-column wrapper with consistent spacing; Study Checkpoints remains full width above Personal Tasks/Projects, which share a row above 900px with wrapping two-column forms. Dedicated pages retain their own layout. Progress/Projects checks pass 5/5, build passes, lint has 0 errors and one existing warning. Source confirms three direct activity cards; HTML CRLF and diff checks pass. Visual browser review remains pending. No commit/push. Next: user reviews dashboard wrapping and alignment.

## Completed checkpoint — compact dashboard skill chart (2026-10-15)

Constrained the home Activity calendar and skill-profile column to equal widths capped at 360px, removing the expanding white card around the radar. The dashboard radar caps at 320px with compact 16px card padding. Both cards stack at widths below 900px and shrink to fit smaller screens. Shared Progress-page chart sizing and all score behavior remain unchanged. Progress checks pass 3/3; build passes; lint has 0 errors and its existing warning; diff check passes. Visual review remains pending. No commit/push. Next: user reviews compact sizing.

## Completed checkpoint — dashboard skill profile (2026-10-15)

Added the Skill profile radar card alongside the home Activity calendar, above the existing Roadmap pulse card. The dashboard and Progress page share the same renderer and computed skill scores; account state, completion and roadmap projection updates refresh the visible graph, including navigation back to the dashboard. A View progress button opens the full report. Shared theme/font roles and the existing narrow-screen stacking are retained. Progress checks pass 3/3, including score parity, live dashboard completion updates, safe labels and full-report navigation; production build passes; lint has 0 errors and its existing warning. HTML CRLF and diff checks pass. Visual review remains pending. No commit/push. Next: user reviews the dashboard placement.

## Completed checkpoint — unfinished calendar carry-forward (2026-10-15)

Unfinished dated calendar sessions, personal tasks and built-in/custom/roadmap checkpoints now display on the current local day, carrying forward through every missed day. Soft red cards include a text label and original assigned date. Completed, future and explicitly unscheduled entries do not roll. Projection recomputes from stored assignments without automatic writes or duplicates, including after reload; manual drag/date changes still persist normally. Sessions have a persisted Completed checkbox. Calendar refreshes at local midnight, focus/visibility return and existing state updates, following today when it was selected. Calendar checks pass 8/8, including leap/month boundaries, real DOM rendering, completion, next-day focus catch-up and existing drag/storage flows. Production build passes; lint has 0 errors and one existing vite.config.ts warning. HTML CRLF/diff checks pass. Visual review remains pending. No commit/push. Next: user reviews carried cards in the preview.

## Completed checkpoint — calendar drag and drop (2026-10-15)

Native drag/drop now moves study sessions, personal deadlines and learning/roadmap checkpoint plans between Week/Month dates, and schedules from or returns checkpoints to Unscheduled. Highlighted targets and live save feedback use the current theme. A date-picker button provides keyboard/touch planning. Sessions retain notes/legacy fields; personal tasks update dueDate; per-user calendarTaskDates stores checkpoint calendar plans with explicit null for unscheduled, separate from original Roadmaps schedule dates shown in the picker. Local-storage/account-load guards run before applying changes; account/navigation reset clears drag state. Final Calendar checks pass 6/6 and Settings 3/3; production build passes; lint has 0 errors and its pre-existing vite.config.ts warning; HTML CRLF and diff checks pass. The first drag-back regression assertion read the old document after a simulated reload; it now uses the reloaded document and passes. Browser visual/touch review remains pending. No commit/push. Next: user tries the calendar preview.

## Completed checkpoint — default profile name (2026-10-15)

Fresh profiles now display Sujay in the welcome greeting, student profile and share card. The profile avatar uses S, and the edit control opens with the displayed name so the user can change it. Existing saved names remain visible. Focused dashboard DOM/unit checks pass 160/160; production build passes; lint has 0 errors and the existing vite.config.ts warning. No commit/push.

# Current task

## Active checkpoint — progress and skill metrics (2026-10-15)

Added a dedicated `?page=progress` sidebar section and Settings shortcut with reference-inspired native SVG skill radar, segmented overall progress gauge, per-skill bars, activity bars and focus area/line graph. Every skill score is rounded verified checkpoints / total * 100; built-in Python and 30 Days of Python aggregate into Python, while other personal/built-in tracks and active roadmaps remain distinct learning paths. Empty tracks show no measured score. Solid-review evidence is counted separately for completed built-in/personal checkpoints and does not inflate scores. Overall progress weights checkpoint counts and excludes personal tasks; activity charts explicitly include personal-task actions. Focus charts use dashboard timer minutes, with 7/30/90-day controls and no future/invented points. Radar shows up to eight highest-progress skills; all skills appear in the list. Next-step buttons open real checkpoints, clearing stale filters and focusing the target; roadmap tasks open their study detail. Values recompute from the existing account state/frame projection on updates and the page renders only when visible. No new persistence, dependency, cloud call or schema. Focused Progress/Settings/library checks pass 11/11; build/lint pass (one existing warning); live page/module/CSS HTTP 200; HTML CRLF preserved. Visual browser review remains pending. No commit/push. Next: user preview review.

## Active checkpoint — five additional color palettes (2026-10-15)

Settings now offers five additional muted palettes: Sage archive, Slate studio, Sand notebook, Rose ledger and Plum archive, alongside the original Paper & charcoal. All six have light/dark variants, live swatch previews and one selected state. `appearance.js` whitelists and saves browser-wide `sem-assist-palette`, initializes color roles before paint, syncs storage events and reapplies the selected palette on theme-mode changes. Shared `palette.css` bridges the older dashboard/Roadmaps/404 tokens and sidebar colors; Roadmaps local dark study view receives the selected palette dark variant independently. Main layout/font preferences and per-user study state remain unchanged. Final Settings checks pass 3/3, including persistence, cross-document storage handling, invalid choices and text contrast (primary >=7:1, muted >=4.5:1 on paper/cards, sidebar >=4.5:1). Calendar/library checks pass 9/9. Build/lint pass (one existing warning); palette CSS returns HTTP 200. Source/HTML CRLF checks pass. Visual browser review remains pending. No commit/push. Next: user preview review; additional font choices await user input.

## Active checkpoint — month/week all-day calendar (2026-10-15)

Calendar now has Week/Month controls and shows only all-day entries. Removed the 24-hour grid, time slots, overlap layout and session time/duration inputs. New sessions require a title/date with optional track/notes. Existing timed records retain their IDs, dates, notes and legacy numeric timing fields while rendering as all-day; edits preserve those fields. Month navigation advances to the first of the adjacent month to avoid month-end rollover, uses a Monday-aligned 42-cell grid including neighboring dates, and counts the selected month only. Track filters, search, source-task links, CRUD and storage/account safeguards remain available. Unscheduled tasks are collapsible. Focused calendar/settings/library checks pass 11/11; build and lint pass (one existing warning). HTML CRLF preserved. Visual browser review remains pending. No commit/push. Next: user preview review.

## Active checkpoint — app settings (2026-10-15)

Added `?page=settings` with a bottom-sidebar Settings entry (also available on mobile), Theme, Fonts, Workspace and Saved data sections. Theme mode supports system/light/dark and keeps the current paper/charcoal palette; additional palettes remain deferred until the user supplies them. Body/headings/numbers selectors use the three existing local fonts, with defaults DM Sans/Heming/Heming and a restore-defaults action. Shared `appearance.js` stores whitelisted roles in browser-wide `sem-assist-fonts`; `theme.js` exposes a preference API, handles system reset and notifies the settings form. Dashboard, Calendar, Roadmaps and 404 consume the shared font roles; same-origin frame/tab storage events update appearance. Study data remains in its existing account envelope. Management buttons reuse existing page navigation/profile/data controls. Final Settings checks pass 2/2; Calendar/library checks pass 8/8; build, lint (one existing warning), release types and HTTP Settings/assets checks pass. A fresh-state test assertion was corrected because appearance changes intentionally do not create a study-state record. Visual browser review remains pending. No commit/push. Next: user provides palette/font choices and previews Settings.

## Active checkpoint — full study calendar (2026-10-15)

Added a dedicated `?page=calendar` workspace page with seven-day time grid, all-day deadlines, mini month/week selection, previous/next/Today navigation, timezone label, track filtering and a task rail. Timed study sessions support create/edit/delete, overlap lanes, track association and notes. Normalized `calendarEvents` share per-user dashboard persistence/export/sync (500 maximum, local dates, no midnight crossing); writes preflight storage and account loading, and account changes clear drafts. Personal task due dates and effective roadmap assignment dates are displayed as all-day source entries; opening one navigates to its task. Roadmap projection includes active schedule dates and saved assignment moves without private notes. Calendar renders only when its page is visible. No new dependency or database schema. Build, lint (one existing warning), release types and HTTP page/assets checks pass; Full regression run passed 255/256 cases; the remaining failure was a search test selecting a built-in checkpoint instead of the new session. Corrected that selector; final focused calendar/library run passes 8/8, including searching from the separate Search page with an incompatible calendar filter. Browser visual review remains pending. Preview recovered as hidden Vite process 21160. No commit/push. Next: user preview review at `http://localhost:3000/study-dashboard.html?demo=1&page=calendar`.

## Active checkpoint — Projects (2026-10-14)

Projects now sits below Personal Tasks on home, with a sidebar anchor, name/description creation, three status choices and deletion. The existing per-user JSON state gains a normalized projects array (100 records maximum); saves preflight storage and wait for account loading, while account changes reset drafts. Projects join universal search and are hidden on dedicated workspace pages. Checkpoint totals are unaffected. Full suite 253/253, build and lint pass (one existing warning). Visual browser review remains pending. No commit/push. Next: user preview review.

## Active checkpoint — dashboard section order (2026-10-14)

Study Checkpoints now appears above Personal Tasks in the main dashboard layout. Source order confirmed. No test run was needed for this markup-only move. No commit/push. Next: preview the dashboard if desired.

## Active checkpoint — learning management and universal search (2026-10-14)

Learning tracks remain on home and also have `?page=learning`, with personal track creation, optional topics, append-only checkpoints, uploaded covers, 32 icons, and per-track sidebar visibility. Existing tracks/roadmaps can have appearance preferences without modifying their definitions. Personal tracks join checkpoint progress, queue, review, journal, profile and semester report flows through `allLearningTracks`. Per-user state gains normalized `learningTracks` and `trackSettings`; older legacy progress is normalized before feature use. Storage preflight avoids silent loss of new cover/track changes. Cover input is decoded/resized into a bounded JPEG; active editor drafts reset on account changes.

Universal Search (`?page=find`, sidebar Search or `/`) indexes tracks/checkpoints, projected roadmap tasks/instructions/topics/objectives/resources/milestones, saved resources, personal tasks and focus notes. Results open the matching checkpoint or roadmap task/detail/view. Roadmap projections include account identity; stale other-account projections are ignored. Package definitions are searchable; private Roadmaps learner notes are not projected. Account changes immediately reset editor drafts; track saves are blocked while the next account loads. Full suite passes 251/251; build, lint (1 existing warning) and release types pass. Preview pages, JS and icons return HTTP 200. Browser visual verification remains unavailable after the prior local-URL policy block. No commit/push. Next: user preview review, including actual native upload and responsive layout.

## Active checkpoint — checkpoint hover lists (2026-10-14)

Checkpoint cards now open on mouse entry and collapse when the pointer leaves the entire card and its floating list. Movement among descendants does not close the list; checking a task preserves hover through the redraw. Pointer exit clears lingering mouse focus and expanded state. Hovered headers do not toggle closed on click; touch and keyboard expansion remain available. Applies to built-in and saved-roadmap cards. Full suite passes 242/242; build and lint pass with the existing warning. Visual browser verification remains pending. No commit/push. Next: user preview review.

## Active checkpoint — top-bar welcome and dedicated pages (2026-10-14)

Welcome replaces the top date; the duplicate welcome row is removed. Activity uses a compact calendar column with a full-width monthly heatmap and top-aligned Roadmap pulse. Resources, Roadmaps and Review are dedicated query-based views (`?page=resources`, `?page=roadmaps`, `?page=review`) with shared sidebar/state, browser history and direct-link support. Inactive sections are hidden from the main dashboard. Roadmaps stays mounted to supply track projections. Old roadmap deep links and toolbar/keyboard navigation remain functional. Full suite passes 241/241; production build and lint pass (one existing warning). The live preview serves all four URLs with HTTP 200 and the updated JS; HTML CRLF preserved. Visual browser verification remains blocked by the prior local-URL policy rejection. No commit/push. Next: user preview review.

## Active checkpoint — Roadmaps loads with dashboard (2026-10-14)

Preview recovery: replaced two verified stalled project Vite processes with a hidden background server outside the sandbox. Dashboard returned HTTP 200 at `http://127.0.0.1:3000/study-dashboard.html?demo=1`. Next: refresh the preview for visual review.

The embedded Roadmaps workspace now starts at the beginning of dashboard initialization, alongside dashboard setup, so its library and saved-track projection can load sooner. Production build passed; lint has 0 errors and its 1 pre-existing warning; focused local-demo/frame test passed (1/1). Broader dashboard DOM runs stalled at Vitest startup without results. Vite preview is running at `http://127.0.0.1:3000/`, but browser inspection was blocked by the computer-use URL policy. Next: review the refreshed preview and rerun the broader tests when the runner is responsive.

## Active checkpoint — welcome and roadmap tracks (2026-10-14)

The welcome greeting now sits at the top of the dashboard. The Learning Tracks
gallery shows all six built-in tracks and active saved roadmaps. Roadmap tasks
also appear in Study Checkpoints with live completion status from the Roadmaps
workspace, contribute to overall totals, and populate the Upcoming Checkpoints
focus dropdown. Choosing a roadmap queue row opens that roadmap. The browser
preview verified the saved Beginner Python roadmap across the gallery, queue,
and checkpoint list. Full suite: 237/237; lint: 0 errors and 1 pre-existing
warning; production build passes. TypeScript check remains red only for the
pre-existing client/src errors listed in AGENTS.md. Changes are local and
uncommitted. Next: user review of the preview.

## Active checkpoint — supplied Heming font (2026-10-13)

Added the licensed variable font to the local public font assets and applied it
to dashboard headings, metric numbers, and learning-track titles, plus Roadmaps
headings, topic titles, graph labels, and progress numbers. Production build
includes the font asset; all 236 tests pass; lint has 0 errors and its one
pre-existing warning. The first test run exposed a missing storage fixture in a
track-selection DOM test, which is now seeded correctly. Changes are local and
uncommitted. Next: review the updated typography in the preview.

## Active checkpoint — monthly activity heatmap and roadmap access (2026-10-13)

The Activity calendar now renders only the current month as a compact seven-column
heatmap with weekday headings and a current-day outline. Learning Tracks and Study
Checkpoints each link directly to My Roadmaps. Browser and automated verification
were not run. Changes are local and uncommitted. Next: inspect both links and the
monthly layout in the browser preview.

## Active checkpoint — track-linked checkpoint queue (2026-10-13)

Selecting a learning track now sets the persisted Upcoming Checkpoints filter to
that track, redraws its queue immediately, and updates the study inspector. No
checkpoint progress is changed. Browser and automated verification were not run
for this change. Changes are local and uncommitted. Next: verify track selection
and queue contents in the browser.
## Active checkpoint — home overview cleanup (2026-10-13)

The Daily log, Recent study entries, and Resource shelf cards were removed from
the home overview. The focus timer moved to an expandable panel in Activity
calendar; its existing controls and saved sessions remain. Resources remain in
the full Resource canvas. Browser checked the shorter overview and timer panel;
93 dashboard DOM tests, production build, and lint pass (0 errors, one existing
warning). These changes are local and uncommitted. Next: user preview/review;
cloud rollout and full accessibility audit remain open.
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
