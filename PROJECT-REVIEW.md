# Jain Study Dashboard — Project Review & Improvement Report

*Report generated September 3, 2026 after a full test pass of the project.*

---

## 1. Executive summary

The project is a Vite + React + Express app whose real product is the self-contained static
dashboard at `client/public/study-dashboard.html` (SEM ASSIST). The React app is a thin shell that
redirects to that page. The dashboard itself is well built visually and its core interactions
(checking checkpoints, custom tasks, resources, timer, search, export, reset) all work.

**However, the app currently cannot persist any data, which is its most important bug:**

1. **Local persistence is broken.** `localStorage.setItem` is *never* called anywhere in the code.
   The UI repeatedly claims "Progress is saved in this browser", but state is only kept in memory
   (`currentState`) and cloud-saved to Supabase. A reload loses everything unless Supabase works.
2. **Cloud persistence is broken too.** The Supabase table `public.study_progress` defined in
   `supabase/schema.sql` **does not exist** in the live project (`PGRST205: Could not find the table
   ... in the schema cache`, verified via REST API). Every save attempt fails with
   "Could not save progress. Please try again."

Net effect: **all check-ins, custom tasks, and resources are lost on every page reload.**
The schema SQL has simply never been applied to the Supabase project, and the client-side
localStorage write that the UI promises was never implemented.

Other notable issues: the production build ships broken analytics placeholders
(`%VITE_ANALYTICS_ENDPOINT%`), signed-out visitors see an empty checkpoint list, there are zero
automated tests, no linting, and several security hardening gaps (no CSP, no security headers,
unescaped attribute interpolation, no CAPTCHA on signup).

---

## 2. How this was tested

| Check | Command / method | Result |
|---|---|---|
| TypeScript typecheck | `pnpm check` (`tsc --noEmit`) | ✅ Passes |
| Production build | `pnpm build` (vite + esbuild) | ✅ Passes, with env-var warnings |
| Dev server | `vite --host` on port 3000 | ✅ Serves app |
| Auth sign-in (wrong creds) | Real form submit against live Supabase | ✅ "Invalid login credentials" |
| Auth sign-up | Real form submit against live Supabase | ✅ Email-confirmation flow engaged |
| All dashboard flows | Live page driven via the browser preview (real DOM clicks/forms) | ✅/❌ see §3 |
| Cloud save path | Stubbed Supabase client capture of `upsert` payload | ✅ Payload correct (debounced) |
| Live Supabase table check | REST + supabase-js queries | ❌ Table missing (PGRST205) |
| Persistence across reload | Reload + re-init of the real module code | ❌ All state lost |

Note: because email confirmation is enabled on the Supabase project (default), no real session could
be obtained, so the full dashboard logic was exercised by re-running the app's *actual* inline module
code inside the page with a stubbed Supabase client (fake user session). All DOM interactions were
performed through the real UI elements, so rendering, state transitions, and event handlers are the
real production code.

---

## 3. What works (verified behavior)

- **Task check-off math:** checking `python-1` correctly updates overall progress (`1 / 76`), open
  steps (76 → 75), streak (1), proof points (10), Python percent (8%), focus card (`1 / 12`),
  activity calendar ("1 active days · 1 completions"), weekly rhythm (1), and per-track meters.
  Unchecking correctly reverses all of it.
- **Custom tasks:** add ("1 open · 1 total", total 76 → 77), check off (proof 10, streak 1,
  activity recorded, `done` styling applied), and delete (counts return to 0) all work.
- **Resources:** save with name/URL/note/color works; cards render with working links and delete
  buttons; drag-and-drop persists position in state (moved from 18px → 90px and clamped correctly).
- **Input validation:** `javascript:alert(1)` URLs are rejected ("Add a name and a valid http(s)
  link."); HTML in custom-task titles is HTML-escaped (no stored-XSS via that path).
- **Timer:** start counts 00:00 → 00:02, pause stops it, reset returns to 00:00.
- **Search/filter:** "linked list" surfaces the 3 matching rows; All/Open/Done filters work.
- **Reset:** with confirm() accepted, returns dashboard to a fresh state.
- **Legacy migration:** v1 data (`py-01`, `java-05`, boolean activity) migrates correctly to
  `python-1`, `java-5`, numeric activity, dropping unknown keys.
- **Cloud-save plumbing:** when signed in, `saveState` upserts the full state (debounced 250 ms)
  with the correct `user_id` — the wiring is right, only the destination table is missing.

---

## 4. Bugs found (priority order)

### 🔴 CRITICAL

1. **No local persistence — `localStorage.setItem` is never called.**
   `saveState()` only updates `currentState` and (when signed in) upserts to Supabase. Verified:
   after completing tasks, adding a custom task and a resource, `localStorage` had no
   `aster-study-dashboard-v3` key; after reload everything was gone (0 completed, 0 tasks,
   0 resources). The UI copy ("Progress is saved in this browser", "Stored locally in this
   browser") is false today. *Fix: write-through `localStorage.setItem(STORAGE_KEY, ...)` in
   `saveState`, load it on boot, and flush on `beforeunload`/`visibilitychange`.*

2. **Supabase table `public.study_progress` does not exist in the live project.**
   `supabase/schema.sql` (table + RLS) has not been run in the Supabase SQL Editor. Verified with
   both the JS client and a raw REST call:
   `404 PGRST205 Could not find the table 'public.study_progress' in the schema cache`.
   Every cloud save therefore fails. *Fix: run `supabase/schema.sql` once in the Supabase project.*

### 🟠 HIGH

3. **Signed-out visitors see an empty workbench.**
   `renderTracks()` is only called from `applySession(user)` when a user exists. With no session the
   checkpoint list is never rendered (verified: `#checkpoints` has 0 children) and the "Study
   checkpoints" card is blank with no empty state. If Supabase is unreachable, the same happens to
   signed-in users.

4. **Sign-out leaves stale UI.**
   `applySession(null)` returns early, leaving all track cards and counts on screen while
   `currentState` is reset to null — the next interaction computes from an empty state and can
   destroy visible data.

5. **Production build ships broken analytics placeholders.**
   `client/index.html` contains `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%`
   (unset in this environment). The built `dist/public/index.html` literally contains
   `src="%VITE_ANALYTICS_ENDPOINT%/umami"`, producing a 404 request on every page load and a
   non-module script warning. *Fix: provide a `.env.example`, guard the tag, or remove it.*

6. **Pending saves can be lost on tab close.**
   Cloud save is debounced 250 ms with no flush on unload — closing the tab right after an action
   drops the last change even once the table exists. Use `navigator.sendBeacon` / flush on
   `visibilitychange`.

### 🟡 MEDIUM

7. ~~No automated tests.~~ **Resolved.** `study-dashboard.js` is now a proper ESM module (lazy
   Supabase client, no auto-`init()` — the browser boots via `study-dashboard-boot.js`) and exposes
   its internals for testing. `pnpm test` runs 29 vitest tests: unit coverage of stats, streak,
   migration, date keys, `saveState` localStorage write-through, escaping, URL and color
   validation, plus jsdom smoke tests that drive the real dashboard HTML (render on boot, full
   check/uncheck cycle, custom tasks, resources, reload persistence, invalid URL rejection).
8. **No linter / CI.** No ESLint config, no CI workflow.
9. ~~Second copy of the dashboard.~~ **Resolved** — the stale root `Mission-CS-Study-Dashboard.html`
   ("Aster Study") duplicate was removed; `client/public/study-dashboard.html` is the single source
   of truth and the root URL now redirects straight to it.
10. **Dead/unused scaffolding.** `drizzle/schema.ts` defines a MySQL `users` table for a Manus OAuth
    flow that nothing uses; `client/src/const.ts` OAuth helpers are unused; the React Home page is
    just a redirect. Decide whether to wire these up or delete them.
11. **`⌁` header button does nothing** (title: "Local progress storage"). Remove or implement.
12. **No progress import.** There is "Export progress" but no "Import" — a user who switches
    browsers cannot restore an exported file.
13. **Timer is decorative.** Focus time resets on reload and never feeds stats; consider persisting
    it and optionally counting it toward activity.
14. **Multi-device last-write-wins.** First sign-in only uploads local state when the cloud row is
    absent; concurrent edits across devices/tabs silently overwrite. Consider merging `completed`
    keys rather than replacing the whole blob.
15. **Duplicate-listeners hazard in init().** `init()` attaches listeners to static DOM; if the
    script ever runs twice (or hot-reloads), handlers double-fire. Guard with an initialized flag.
16. **`pnpm approve-builds` pending.** `@tailwindcss/oxide` and `esbuild` postinstall scripts were
    skipped; builds still work, but approve them to avoid subtle binary issues.

---

## 5. Improvements (features & engineering)

### Persistence & data
- **P0 — implement real persistence:** write-through localStorage + cloud sync; add an explicit
  "Synced to cloud / saved locally / offline" indicator instead of misleading copy.
- **P0 — apply `supabase/schema.sql`** and verify RLS with `select * from pg_policies;`.
- Add a JSON **import** (mirror of export) and a "Download backup" with a proper filename/date.
- On first sign-in, **merge** local and cloud state instead of overwriting either side.
- Add a `beforeunload`/`visibilitychange` flush for the debounced save.

### Dashboard features (matches the open items in `todo.md`)
- Inline editing for custom task titles and cadence.
- Due dates for custom tasks + overdue highlighting.
- Sort/group custom tasks by cadence and due date.
- Persist the focus timer; add daily/weekly focus totals; wire into stats.
- Empty-state text inside the workbench when filters match nothing (currently relies on the
  generic `.empty-state`, which is hidden while the list is empty and unsigned-in).
- A "reset" confirmation that clearly states what will be lost and offers an export first.

### Engineering
- ~~Extract the dashboard's inline module script~~ **Done** — it lives in
  `client/public/study-dashboard.js` and is unit-tested.
- ~~Add unit tests~~ **Done** — `pnpm test` (29 vitest tests in `tests/`, see §4 item 7).
- Add ESLint + a CI workflow (typecheck, lint, build, tests).
- Add `.env.example` documenting `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`,
  `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`.
- Add a README for end users: local dev, Supabase setup steps, deployment (the setup instructions
  currently live only in agent-oriented `continue.md`).
- ~~Clean the Manus-specific tooling from `vite.config.ts` (`vite-plugin-manus-runtime`,
  `vitePluginManusDebugCollector`, `vitePluginStorageProxy`) or gate it behind an env flag~~ —
  **DONE**: all three are now gated to non-production mode (`process.env.NODE_ENV !== "production"`),
  so the ~367 KB injected runtime no longer ships in production builds (verified: built
  `index.html` dropped from 367.53 kB to 0.64 kB, zero manus references). Dev server behavior is
  unchanged.
- Fix the wouter patch (pollutes `window.__WOUTER_ROUTES__`) or drop the patched dependency.
- Home.tsx: replace the `dangerouslySetInnerHTML` redirect with a proper `useEffect`
  `window.location.replace(...)`.
- Add server-side hardening: `helmet`-style headers, gzip, cache-control for hashed assets, and a
  real 404 for missing files instead of serving `index.html` for everything.
- Accessibility: add `aria-label`s to the `⌁`/`◌` icon buttons and timer controls; ensure the drag
  interaction has keyboard alternatives; the checkboxes are already properly labelled.

---

## 6. Security vulnerabilities

### High
1. ~~No Content-Security-Policy.~~ **Resolved.** The inline module script was extracted to
   `client/public/study-dashboard.js` so the CSP can drop `'unsafe-inline'` for scripts. A CSP
   (meta tag in `study-dashboard.html`, matching header in `server/index.ts` with
   `frame-ancestors 'none'`) now allows only `'self'`, the pinned `esm.sh` module, Google Fonts,
   and the Supabase project endpoints. Any injected inline script is now blocked.
2. ~~No security headers from the Express server.~~ **Resolved.** `server/index.ts` now sends
   `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
   `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, HSTS (production), and
   disables `X-Powered-By`.
3. **Broken RLS setup masks a real risk.** The design correctly relies on Row Level Security with
   the publishable key, but the table/policies were never applied. If someone later applies a
   looser policy (or the key leaks into a `service_role`-style use), there is no defense in depth.
   Apply the provided policies, verify them, and never put a `service_role` key in the client.

### Medium
4. ~~Unescaped interpolation in resource rendering.~~ **Resolved.** `renderResources()` now escapes
   `resource.id` (attribute context) and validates `resource.color` through `safeColor()`
   (strict `#rrggbb` check with a default fallback), blocking attribute/HTML and CSS injection
   through crafted state. Verified with hostile payloads (`""><img onerror>`, `javascript:` URLs,
   `red;background:url(...)`) — nothing executes, and delete still resolves escaped ids.
5. **Sign-up abuse / email enumeration.** Sign-up has no CAPTCHA, so anyone with the public key can
   create accounts (spam/storage abuse); "User already registered" responses also enumerate
   accounts. Enable Supabase's hCaptcha option and consider rate limits.
6. **Third-party CDN supply chain.** supabase-js is now pinned to the exact version
   `@supabase/supabase-js@2.115.0` (was the floating `@2` tag) from `esm.sh`. Remaining optional
   hardening: add an integrity hash or self-host the module.
7. **Weak password policy.** The form enforces only `minlength="6"`; Supabase's default minimum is
   6. Enforce 12+ characters and consider MFA for this personal dashboard.
8. **Open dev server on all interfaces.** `vite --host` binds `0.0.0.0` (visible as
   `172.16.0.111:3000` during testing) and `allowedHosts` includes several wildcard domains. Fine
   for local dev, but ensure it is never used in production.

### Low
9. **Email confirmation link depends on a hardcoded `http://localhost:3000` redirect.**
   `supabase-config.js` pins `redirectUrl` to localhost. Deployed without editing, password-reset
   and confirmation emails point at localhost and the flow silently breaks; on an HTTPS origin the
   callback also mismatches. Make it relative to `window.location.origin` or a build-time env var.
10. **`dangerouslySetInnerHTML`** in `Home.tsx` runs a script string; it is static and safe today but
    is a code smell — replace with a normal redirect in an effect.

---

## 7. Database vulnerabilities (Supabase)

1. **Schema not applied (blocking).** `public.study_progress` does not exist in the live project
   (verified PGRST205 over REST). Run `supabase/schema.sql` in the SQL Editor — everything else in
   this section is moot until that happens.
2. **Missing DELETE policy.** RLS policies exist only for `select`, `insert`, `update`. Authenticated
   users can never delete their own row — fine for the current feature set, but account-deletion
   flows will need `for delete using (auth.uid() = user_id)`.
3. **Unbounded JSONB blob per user.** The entire state (including dragged resource positions and
   notes) is one JSONB column with no size cap, no rate limit, and no quota. A malicious client (or
   runaway custom tasks) can store megabytes per request and bloat the table. Add a trigger
   rejecting payloads above a sane size (e.g. `pg_column_size(state) > 1_000_000`) and/or cap
   `customTasks`/`resources` lengths client-side.
4. **Last-write-wins concurrency.** The client upserts the full `state` blob; two open tabs/devices
   overwrite each other with no versioning or merge. Add `updated_at`-based conflict detection or
   merge keys on the client before upsert.
5. **`updated_at` is client-supplied.** The row's `updated_at` is set from `new Date().toISOString()`
   in the browser; a misbehaving client can backdate it. Prefer a database trigger
   (`before update ... set updated_at = now()`).
6. **No backup/DR documentation.** There is no documented backup schedule or restore procedure for
   the `study_progress` table; for a personal dashboard this is low risk, but an export/import flow
   (see §5) is the practical safety net.
7. **No row-level integrity constraints.** Nothing validates that `state` is a JSON object with the
   expected shape at the database level; `normalizeState()` patches missing keys on read, but a
   malformed blob from any writer (including a future buggy client) is silently accepted.
8. **Auth hardening available but unused.** Email confirmation is on (good); CAPTCHA, password
   strength policy, and MFA are not configured (see §6).

---

## 8. Recommended action plan

**Immediate (1–2 hours):**
1. Run `supabase/schema.sql` in the Supabase SQL Editor; verify RLS policies exist.
2. Add `localStorage.setItem(STORAGE_KEY, state)` (write-through) in `saveState()` + load on boot.
3. Render the workbench on boot regardless of auth state; re-render cleanly on sign-out.

**This week:**
4. Fix the production analytics placeholders (`.env.example` or remove the tag).
5. Add tests (vitest) for the pure logic + a DOM smoke test; add ESLint.
6. Add `beforeunload`/`visibilitychange` flush; add JSON import; add sync-status indicator.

**Next:**
7. Security headers + CSP; pin/self-host supabase-js; CAPTCHA on signup; password policy.
8. Timer persistence, custom-task editing/due dates, multi-device merge, DB size/update triggers.
9. Remove remaining stale artifacts (unused drizzle schema, Manus tooling, dead OAuth helpers) and
   write the user-facing README.

---

## 9. Appendix — key files

| File | Role |
|---|---|
| `client/public/study-dashboard.html` | The actual product (SEM ASSIST dashboard) |
| `client/public/supabase-config.js` | Supabase URL, publishable key, redirect URL |
| `supabase/schema.sql` | The table + RLS that still needs to be applied |
| `server/index.ts` | Static file server (production) |
| `client/src/Home.tsx` | Redirect shell → `/study-dashboard.html` |
| `vite.config.ts` | Dev/build config incl. Manus debug tooling |
| `continue.md` / `todo.md` | Agent handoff + feature backlog |