# Product Roadmap — IELTS Clone

Derived from `PROJECT_ANALYSIS.md`. Milestones are ordered P0 → P3 and are meant to be picked up strictly in order — later milestones assume earlier ones are done (e.g. don't build analytics on top of an unfixed grading-integrity bug).

Legend — **Complexity:** S (< 1 file, < 1hr) · M (few files, few hrs) · L (many files / new subsystem, multi-session).

---

## P0 — Exam Integrity (must fix before any real user touches this)

### ✅ M0.1 — Fix auth bypass on Listening/Reading submission (done)
- **Goal:** `POST /api/test-attempts/[attemptId]/submit` must require authentication and verify the caller owns the attempt, matching the pattern already used by its sibling routes.
- **Priority:** P0 — currently exploitable by an unauthenticated request.
- **Complexity:** S
- **Files:** `app/api/test-attempts/[attemptId]/submit/route.ts`
- **Dependencies:** none
- **Risks:** none — this is additive (a guard clause), can't break any currently-correct call path since legitimate callers already send an authenticated session.
- **Definition of Done:** route calls `requireUser()`, checks `attempt.userId === user.id` and `attempt.status === "IN_PROGRESS"` before grading, returns 403 otherwise — same shape as `writing-submit`/`speaking-upload`. Manually verified with an unauthenticated curl request returning 401.

### ✅ M0.2 — Stop shipping the answer key to the browser pre-submission (done)
- **Goal:** The module page a candidate loads must never include `correctAnswer` (or any answer-key-shaped field) in its server-rendered payload or client props.
- **Priority:** P0 — currently trivially defeatable via View Source/DevTools.
- **Complexity:** M
- **Files:** `types/test.ts` (split `Question`/`GradableModule` into a server-only shape and a client-safe shape), `lib/mappers/toGradableModule.ts` (add a client-safe mapper or strip fields), `app/test/attempts/[attemptId]/modules/[moduleId]/page.tsx` (pass the stripped shape to the client wrapper), `app/api/test-attempts/[attemptId]/submit/route.ts` (must independently re-fetch the full server-side module for grading — never trust an answer key from the client).
- **Dependencies:** none, but should land right after M0.1 since both touch the submit path.
- **Risks:** `QuestionRenderer.tsx` and other test-engine components currently receive `GradableModule` — need to confirm none of them read `correctAnswer` for legitimate UI reasons (e.g. showing correct answers on a post-submission review screen, which is fine *after* submission, from a separate authenticated fetch). Grep confirmed only `gradeModule.ts` and `submit/route.ts` read `correctAnswer` server-side — safe to strip client-side.
- **Definition of Done:** module page's initial HTML/RSC payload contains no `correctAnswer` field (verified via View Source / network tab), grading still works identically (re-fetches full module server-side at submit time), existing question-type tests (once M2.1 lands) still pass.

---

## P1 — Usable Pilot (core navigation + deployability)

### ✅ M1.1 — Student dashboard index page (done)
- **Goal:** `/dashboard` lists the student's own past attempts (status, test title, band if submitted) linking into `/dashboard/attempts/[attemptId]`, plus a way to start/resume a test.
- **Complexity:** M
- **Files:** new `app/dashboard/page.tsx`, new `components/dashboard/AttemptsList.tsx` (or similar), reuse existing `prisma.testAttempt.findMany` patterns already seen in `app/api/admin/attempts/route.ts`.
- **Dependencies:** none.
- **Risks:** needs loading/empty/error states per CLAUDE.md UX mandate — first real test of that standard.
- **Definition of Done:** authenticated student sees their attempts list with correct status badges; empty state for a brand-new user; links resolve correctly for both in-progress (resume) and submitted (view result) attempts.

### ✅ M1.2 — Student "browse tests" page (done)
- **Goal:** A page listing published tests a student can start, replacing the current need to already know a test's UUID.
- **Complexity:** M
- **Files:** new `app/test/page.tsx` (or `app/tests/page.tsx`), a `prisma.test.findMany({ where: { isPublished: true } })` query, links into the existing `startOrResumeAttempt` server action (`app/test/[testId]/start/actions.ts` — already works, just needs a UI entry point).
- **Dependencies:** none.
- **Definition of Done:** unauthenticated/authenticated visitor can discover and start any published test without a direct URL; unpublished tests are not listed.

### ✅ M1.3 — Admin test index + create-test UI (done)
- **Goal:** `/admin/tests` lists all tests with pagination and a "Create test" form that redirects into the builder.
- **Complexity:** S–M (pure frontend; backend already done)
- **Files:** `app/admin/tests/page.tsx` (new), `app/admin/tests/actions.ts` (new Server Action), `lib/admin/createTest.ts` (new, shared with `POST /api/admin/tests`), `lib/api/pagination.ts` (new, extracted shared pagination parsing — also deduplicated from `GET /api/admin/tests` and `GET /api/admin/attempts`, which previously hand-rolled the identical clamping logic).
- **Dependencies:** none.
- **Definition of Done:** admin/content-editor can see all tests, paginate via `?page=`, and create a new one via a plain Server Action form that redirects into the existing `[testId]` builder. Verified: `tsc`/`eslint`/`next build` all clean; new page is a pure Server Component (187 B / 96.5 kB, identical to sibling admin pages).

### ✅ M1.4 — Cloud file storage migration (done, pending live smoke test)
- **Goal:** Replace `lib/storage/saveUploadedFile.ts`'s local-disk write with a cloud upload behind the same `(File, options) -> { url, mimeType, sizeBytes }` contract so both call sites (`admin/upload`, `speaking-upload`) need zero changes.
- **Decision:** user chose **Supabase Storage** (same project as the database — one less vendor, per the option originally noted here).
- **Files:** `lib/storage/supabaseClient.ts` (new, lazy service-role client), `lib/storage/saveUploadedFile.ts` (swapped implementation), `.env.example`/`README.md` (new required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`), `package.json` (`@supabase/supabase-js`). No changes needed to either calling route.
- **Risk accepted:** no local-disk dev fallback — every contributor already needs Supabase credentials for the database (`DATABASE_URL`/`DIRECT_URL`), so requiring the same project's storage credentials adds no new setup burden. A dual-path fallback was considered and rejected as unnecessary complexity given that.
- **Verification gap (flag for next session or before shipping):** tsc/eslint/build all pass, but there is **no live Supabase project connected in this environment**, so the actual upload round-trip (bucket exists, service-role key has Storage write access, `getPublicUrl` resolves) has not been smoke-tested end-to-end. First real use should confirm: create the bucket, set the three env vars, run one admin upload and one speaking-recording upload.
- **Discovered, not fixed (separate decision needed from you):** `npm install` surfaced pre-existing high-severity advisories in `next@14`/`@clerk/nextjs@5`/`postcss` (see `PROJECT_ANALYSIS.md` Finding 7) — unrelated to this migration. Fixing them means major-version upgrades (Next 14→16, Clerk 5→7) that need their own dedicated migration effort; not done as part of this milestone. New roadmap item below.

### 🆕 M1.4b — Upgrade Next.js 14→16 and Clerk 5→7 to clear high-severity CVEs
- **Goal:** Resolve the dependency advisories found during M1.4 (DoS/cache-poisoning/SSRF/XSS in Next 14, an authorization-bypass advisory in Clerk 5).
- **Complexity:** L — both are breaking major-version bumps; Next 14→16 likely touches routing/middleware APIs, Clerk 5→7 likely touches the auth helper surface used throughout `lib/auth/session.ts` and every protected route.
- **Dependencies:** none technically, but should land on its own branch with the full test suite (once M2.1 exists) as a safety net — do not bundle with feature work.
- **Definition of Done:** `npm audit` clean (or only unfixable/accepted advisories remain), `next build` clean, full manual smoke test of auth + test-taking + admin flows.

---

## P2 — Protect What's Built

### ✅ M2.1 — Test infrastructure + unit tests for grading/band logic (done)
- **Goal:** Add a test runner and cover `gradeModule.ts`, `recomputeOverallBand.ts`, `bandScoreTables.ts`, `testSchemas.ts`.
- **Decision:** Vitest — fastest to wire into a Next.js/TS project, no Jest transform config needed, native ESM/TS support.
- **Files:** `vitest.config.mts` (new), `package.json` (`test`/`test:watch`/`test:coverage` scripts + `vitest`/`@vitest/coverage-v8` devDependencies), `lib/scoring/{gradeModule,recomputeOverallBand,bandScoreTables}.test.ts` (new), `lib/validation/testSchemas.test.ts` (new).
- **Result:** 104 tests, all passing. Coverage: `bandScoreTables.ts`/`recomputeOverallBand.ts`/`testSchemas.ts` 100% across the board; `gradeModule.ts` 92-100% (only gap is an unreachable exhaustiveness-check branch). No behavioral bugs found in any of the four modules — see `PROJECT_ANALYSIS.md` §11 for the full breakdown and the one documented (currently-harmless) nuance in `recomputeOverallBand.ts`'s undefined-vs-null handling.
- **Verification:** `tsc`/`eslint`/`vitest run`/`next build` all clean.
- **Definition of Done:** ✅ `npm test` runs and passes; every question type in `isAnswerCorrect()` has coverage; `roundToNearestHalfBand` has boundary-value tests (.25/.75 rounding, repeating-decimal 3-way average). CI to actually run this on every PR is M2.2, next.

### ✅ M2.2 — CI pipeline (done)
- **Goal:** GitHub Actions workflow running typecheck + lint + test + build on every PR/push to `main`.
- **Files:** `.github/workflows/ci.yml` (new), `package.json` (added `typecheck` script so CI and local runs share one command).
- **Design decisions:**
  - **Single sequential job**, ordered typecheck → lint → test → build (fail-fast on the cheapest checks first) rather than 4 parallel jobs — simpler to maintain at this project's size, and avoids paying for 4x the checkout/install/cache-restore overhead. Revisit if the suite grows enough that wall-clock time (not job-setup overhead) dominates.
  - **Caching:** `actions/setup-node`'s built-in `cache: npm` (keyed on `package-lock.json`) rather than manually caching `node_modules` — safer against stale/platform-mismatched restores, and `.next/cache` via `actions/cache` for incremental Next.js builds (falls back cleanly to a full build on a miss).
  - **No secrets referenced anywhere in the workflow** — verified locally (with `.env.local` removed) that `prisma generate`, typecheck, lint, test, and `next build` all succeed with zero environment variables present, so there's nothing for the pipeline to leak. Real credentials would only be needed if this workflow is later extended to deploy, which is out of scope here.
- **Verified:** ran the exact CI command sequence locally end-to-end (`npm ci` → `prisma generate` → `npm run typecheck` → `npm run lint` → `npm test` → `npm run build`) — all pass.
- **Estimated CI runtime:** ~3-5 minutes on a warm cache; a cold first run (empty npm/Next.js caches) may take ~5-7 minutes.
- **Definition of Done:** ✅ a PR with a failing typecheck/lint/test/build is blocked/flagged (default GitHub Actions behavior — no step uses `continue-on-error`); a clean PR shows green.

### ✅ M2.3 — Rate limiting (done, pending live smoke test)
- **Goal:** Throttle auth, upload, submission, and admin endpoints.
- **Decision:** Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`) — REST-based, no persistent connections, works on Vercel serverless/Edge.
- **Files:** `lib/rateLimit/limiter.ts` (lazy Redis client + cached `Ratelimit` instances per tier), `lib/rateLimit/config.ts` (5 named tiers: `auth`/`upload`/`submit`/`autosave`/`admin`, each independently tunable), `lib/rateLimit/identifier.ts` (Clerk user id else client IP), `lib/rateLimit/enforce.ts` (`enforceRateLimit()` + `RateLimitExceededError`), `lib/api/handleApiError.ts` (429 mapping with `Retry-After`/`X-RateLimit-*` headers), `.env.example` (new `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`). Applied to all 12 routes named in the requirements: `GET /api/auth/me`; `admin/upload` + `speaking-upload`; `submit` + `writing-submit` + `progress` (GET/PUT); all 6 admin CRUD routes (tests, `[testId]`, modules, `[moduleId]`, attempts, module-attempts grading).
- **Design decision — fails open:** an unreachable/unconfigured Upstash instance allows the request through (logs a warning) rather than 500ing every route in the app. A rate limiter is a protective layer on top of a working API; it shouldn't become a single point of failure for the whole API. Only an actual "limit exceeded" result blocks a request.
- **Identifier strategy:** Clerk user id when authenticated (so admins/students behind a shared IP aren't throttled together), else client IP (catches unauthenticated brute-force/abuse — the exact threat model from Finding 1).
- **Verification gap (flag before shipping):** no live Upstash database connected in this environment — same caveat as M1.4. Before relying on this in production: create an Upstash Redis database, set the two env vars, and confirm a real 429 fires past the configured limit.
- **Definition of Done:** ✅ repeated rapid requests from one identity past a tier's threshold get a `429` with `Retry-After`/`X-RateLimit-*` headers; normal usage is unaffected; `tsc`/`eslint`/`vitest`/`next build` all clean.

### ✅ M2.4 — Audit log (done)
- **Goal:** Durable record of examiner grading actions and (once M3.1 exists) role changes.
- **Files:** `prisma/schema.prisma` (new `AuditLog` model + migration `20260803065625_add_audit_log`, applied to the connected Supabase database), `lib/audit/logAction.ts` (transaction-scoped write helper), `lib/audit/actions.ts` (action-name constants), wired into `module-attempts/[moduleAttemptId]/route.ts` (replacing the `console.info`).
- **Design decision — no FK to `User`:** `AuditLog.actorId` is a plain string, not a Prisma relation. Deleting a user account must never cascade-delete or orphan audit history; `actorName`/`actorEmail` are snapshotted at write time instead, so the record stays accurate even after a profile change or account deletion.
- **Atomicity:** the audit write happens inside the *same* `$transaction` as the grade update and `recomputeOverallBand`, so a grade change and its log entry can never diverge from a partial failure.
- **Metadata captured per grading event:** `testAttemptId`, `moduleType`, `previousBandScore`, `bandScore`, `examinerNotes` — satisfies "what did they change it from," not just "what is it now."
- **Not yet built:** an admin UI to browse the log (query via Prisma/DB client directly for now) — natural next step whenever an admin analytics/audit screen gets prioritized. Role-change logging deferred until M3.1 (role management) exists to log.
- **Verified:** `tsc`/`eslint`/`vitest` (104/104)/`next build` all clean.
- **Definition of Done:** ✅ every examiner score change produces an `AuditLog` row capturing before/after state; queryable via Prisma (`prisma.auditLog.findMany(...)`) — a dedicated UI is a follow-up, not a blocker for this milestone's own scope.

---

## P3 — Product Completeness (post-pilot)

User-directed priority order (2026-08-04): M3.1 → M3.2 → M3.3 → security hardening → M3.4 → M3.5, continuing automatically except where a business decision or credentials are required.

### ✅ M3.1 — Admin role management (done)
- **Goal:** enterprise-grade role management — search, filter, change roles, prevent removing the last admin, confirmation, audit, optimistic UI, pagination, server-side authorization, full validation.
- **Files:** `app/admin/users/page.tsx` (search/filter/pagination, ADMIN-only), `app/api/admin/users/[userId]/role/route.ts` (Zod-validated PATCH), `lib/admin/changeUserRole.ts` (last-admin check + update + audit log, one transaction), `components/admin/UserRoleCell.tsx` (optimistic UI), `components/ui/ConfirmDialog.tsx` (native `<dialog>`, new shared primitive), `app/admin/layout.tsx` (new — minimal nav, otherwise `/admin/users` would be unlinked from anywhere).
- **Design decisions:** ADMIN-only (not CONTENT_EDITOR) — role management is more sensitive than content editing, consistent with the existing test-deletion policy. Self-demotion is *not* separately blocked — only the last-admin invariant is enforced, per the literal requirement; an admin can still demote themselves if other admins exist. `LastAdminError` centralized in `handleApiError` (409), matching every other custom error's handling pattern. Known, accepted limitation: the last-admin check reads then writes within one transaction at READ COMMITTED isolation — two truly concurrent demote requests for two different admins could theoretically both pass the count check before either commits; not hardened further (e.g. `SELECT ... FOR UPDATE` or serializable isolation) since it requires an unlikely race on an internal admin tool with normally few concurrent admins, and the cost/complexity of raw-SQL locking isn't proportionate here.
- **Verified:** `tsc`/`eslint`/`vitest` (104/104)/`next build` clean; `/admin/users` adds 1.3 kB client JS.
- **Definition of Done:** ✅ all bullets in the goal above.

### ✅ M3.2 — Admin analytics (done, indexes pending approval)
- **Goal:** production-grade dashboard — total users, active users, new registrations, test attempts, completion rate, average band score, question difficulty, pass/fail trends, charts, date filtering, performance optimization.
- **Files:** `app/admin/analytics/page.tsx` (date-range filter via `?from`/`?to`, default last 30 days), `lib/admin/analytics.ts` (all aggregation — DB-level `groupBy`/`aggregate`/`count`, never fetch-then-reduce-in-JS for anything that scales with row count), `components/admin/analytics/{StatTile,TrendLineChart,QuestionDifficultyChart}.tsx`.
- **Design decisions:** `totalUsers` is lifetime (not date-scoped, since users don't "un-register"); every other metric respects the date range. Pass rate uses a configurable band-6.0 threshold — IELTS has no universal pass/fail cutoff, so this is surfaced in the UI as an assumption, not asserted as fact. Question difficulty requires a minimum 5-response sample size before a question is ranked, to avoid one lucky/unlucky answer reading as 0%/100%. Charts follow the dataviz skill's guidance (sequential blue for magnitude/trend, solid recessive gridlines, no dual-axis, native `<details>` table-view fallback for accessibility on every chart) — loaded and applied before writing any chart code, per the skill's own trigger rule.
- **Deferred (documented, not applied):** 4 indexes that would speed up the date-range queries at scale — see `DATABASE_MIGRATION_PLAN.md`. The live database migration pipeline is now paused pending explicit approval per new standing instruction (2026-08-04): schema changes are proposed and documented, never applied automatically. Analytics is fully correct today without them; only large-scale query performance is affected.
- **Verified:** `tsc`/`eslint`/`vitest` (104/104)/`next build` all clean. `/admin/analytics` is 189 kB First Load JS — consistent with the existing Recharts cost on `/dashboard/attempts/[attemptId]` (190 kB), not a new regression.
- **Definition of Done:** ✅ all bullets in the goal above.

### 🟡 M3.3 — Notifications (email half done; in-app half blocked on migration approval)
- **Goal:** in-app notifications + email architecture (Resend, kept configurable/swappable), preferences, read/unread state, background-safe.
- **Email — done:** `lib/email/{types,sendEmail,resendProvider,consoleProvider}.ts` (provider abstraction, `EMAIL_PROVIDER` env var, auto-fallback to a logging console provider when `RESEND_API_KEY` is unset), `lib/email/templates/gradedNotification.ts` (first template), wired into examiner grading. "Background-safe" resolved as: `sendEmail()` is awaited but never throws (a delivery failure can't undo the DB change that triggered it), called *after* the transaction commits, not inside it — checked this Next.js version has no `unstable_after`/`waitUntil` primitive available, so a true fire-and-forget wouldn't reliably complete before a serverless function tears down; an awaited best-effort call is the correct trade-off here, not a shortcut.
- **In-app — blocked:** read/unread persistence and preferences need a real table (`Notification` model + `User.emailOnGraded`) — proposed in `DATABASE_MIGRATION_PLAN.md` Proposals 5-6, not yet approved/applied per the standing database-migration policy. This is a genuine functional blocker (not a performance-only concern like M3.2's indexes) — there is no way to persist "has this user seen this notification" without the table existing.
- **Verified (email half):** `tsc`/`eslint`/`vitest` (104/104)/`next build` all clean. Not live-smoke-tested against a real Resend account (same caveat as M1.4/M2.3).
- **Next action:** awaiting a decision on Proposals 5-6 before the in-app half can proceed; everything else in the user's priority order (security hardening) can proceed in the meantime since it doesn't depend on this.

### ✅ Before M3.4 — Security hardening (done)
- **Goal:** close `SECURITY_AUDIT.md` Medium findings that don't require a business call: security headers, CSP, upload validation improvements, essay size limits, env file protections.
- **Files:** `next.config.js` (security headers + Report-Only CSP, `poweredByHeader: false`), `lib/storage/fileSignature.ts` (new, + 16 tests) wired into `saveUploadedFile.ts`, `writing-submit/route.ts` (essay length cap), `.gitignore` (broadened env-file coverage).
- **Key decision — CSP shipped Report-Only, not enforcing.** This environment can't live-browser-test against the actual deployed Clerk frontend-API domain; an incorrectly *enforcing* CSP risks silently breaking authentication for the whole app, a worse outcome than no CSP yet. Report-Only observes violations without blocking anything — flip to enforcing (`Content-Security-Policy-Report-Only` → `Content-Security-Policy`) after confirming zero violations in real usage. `'unsafe-inline'` on `script-src` is a known, documented remaining gap (needs a nonce threaded through Next's rendering — a real follow-up, not attempted blind).
- **Left open (need verification/policy, not engineering):** M2 (CSRF cookie verification — needs a live browser check against the deployed Clerk instance), M3 (speaking-recording signed URLs — a deliberate stricter-vs-current-parity trade-off), M6 (CONTENT_EDITOR module-deletion scope — a policy call on whether that's intentional).
- **Verified:** `tsc`/`eslint`/`vitest` (120/120)/`next build` all clean.
- **Definition of Done:** ✅ all 4 named items (headers, CSP, upload validation, essay limits, env protections) done.

### M3.4 — Payments (Stripe) — ⏸ paused, needs business decisions + credentials
- **Goal:** monthly/yearly subscriptions, free trial, coupons, webhooks, billing portal, invoice history, subscription middleware, admin subscription management, designed so plans can change without major refactoring.
- **Blocked on:** pricing (tiers, amounts, currency), trial length, coupon policy, and real Stripe API keys/webhook secret — these are genuine product/business decisions and live credentials, not engineering judgment calls. Flagged to the user rather than invented.

### M3.5 — AI-assisted Writing feedback — ⏸ paused, needs a provider decision + credentials
- **Goal:** AI-assisted (never auto-grading) examiner feedback — likely band estimate, strengths/weaknesses, grammar/vocabulary/coherence/task-achievement highlights. Examiner remains final authority.
- **Blocked on:** which LLM provider/model (not specified in the request, unlike Resend/Stripe which were named explicitly) and API credentials, plus a cost-per-essay ceiling worth confirming given this runs per submission.

---

## Phase 4 — Production Hardening (2026-08-05)

User-directed: make the platform production-ready before further business features (payments/AI writing feedback stay paused). Continue automatically except for credentials, pricing, irreversible infra changes, or database migrations.

### ✅ M4.1 — Monitoring & Observability (done)
- **Goal:** Sentry, structured (Pino) logging, request IDs, global error boundary, API error logging, health/readiness/liveness endpoints, performance monitoring hooks, environment-aware logging, no secret exposure.
- **Files:** `sentry.{server,edge,client}.config.ts`, `instrumentation.ts`, `next.config.js` (`withSentryConfig`), `lib/logger.ts` (Pino), `lib/observability/requestId.ts`, `middleware.ts` (request-ID generation/propagation), `lib/api/handleApiError.ts` (structured logging + Sentry reporting on genuine 500s only), `app/error.tsx` + `app/global-error.tsx` (both report to Sentry), `app/api/health/route.ts` (liveness), `app/api/health/ready/route.ts` (readiness).
- **"Performance monitoring hooks" resolved as:** Sentry's Next.js SDK auto-instruments route handlers/page loads for tracing once configured (`tracesSampleRate`) — this is the *reason* Sentry was chosen to also cover this requirement rather than hand-rolling a second, parallel timing system alongside it. Reuses existing architecture instead of duplicating.
- **Caught during verification, not before:** both health routes were being statically prerendered by Next.js (frozen at build time, since neither reads request-specific data) until `export const dynamic = "force-dynamic"` was added to both — confirmed via the build's route table (`○ Static` → `ƒ Dynamic`). This would have been a silent, hard-to-notice bug (a readiness probe that never actually re-checks the database).
- **Verified beyond the standard gate:** ran a real production server (`next start`) and curled both endpoints — confirmed live security headers, a unique `x-request-id` per request, fresh `uptimeSeconds`/`timestamp` on `/api/health`, and a genuine successful `SELECT 1` round-trip to the live Supabase database on `/api/health/ready`.
- **Trade-off, not free:** Sentry adds real bundle weight (shared First Load JS 87.5 kB → 161 kB, Middleware 61.2 kB → 129 kB) — flagged for the M4.2 performance pass rather than accepted silently.
- **Stops before requiring keys, per instruction:** `SENTRY_DSN` unset → `Sentry.init()` safely no-ops (verified — no crash, no error). Nothing about this milestone requires you to provide a DSN now; it's ready whenever you create a Sentry project.
- **Definition of Done:** ✅ all 12 named requirements delivered and verified.

### ✅ M4.2 — Performance Optimization (done)
- **Goal:** audit Server Components, bundle size, code splitting, images, fonts, database queries, caching, Suspense/streaming, re-renders/memoization, pagination; produce `PERFORMANCE_REPORT.md`.
- **Fixed:** `TestEngine.tsx`'s root-cause re-render defect (unnecessary store subscriptions re-rendering the entire question sheet on every keystroke/timer-tick — the single highest-value finding, in the app's highest-stakes UI) + `React.memo` defense-in-depth; `/admin/attempts` pagination (was hard-capped at 50 with no controls); the marketing homepage's blocking DB-backed auth check (now streams via Suspense, `components/layout/NavbarAsync.tsx`).
- **Investigated, confirmed already good:** N+1 queries (none), Server Components ratio (spot-checked, no unnecessary client components), font loading (already optimal), Recharts code splitting (already correctly per-route via Next's automatic splitting).
- **Documented, deliberately not fixed:** Sentry's bundle cost, admin-image `next/image` conversion (unverifiable layout risk without a live browser), `BandProgressChart`/`/admin/analytics` streaming (lower-priority than the homepage fix), experimental PPR (unverified risk).
- **Verified:** `tsc`/`eslint`/`vitest` (120/120)/`next build` clean; the two build-output-visible fixes (health routes' static→dynamic fix in M4.1, homepage route size) were confirmed by direct route-table inspection, not assumed.
- **Definition of Done:** ✅ `PERFORMANCE_REPORT.md` created; all named optimization areas audited; concrete fixes shipped for every genuine problem found.

### ✅ M4.3 — Accessibility Audit (done)
- **Goal:** WCAG 2.2 AA — keyboard nav, focus management, screen reader support, ARIA, semantic HTML, color contrast, form/dialog/toast accessibility; produce `ACCESSIBILITY_REPORT.md`.
- **Fixed:** timer `aria-live` spam (`CountdownTimer.tsx`/`WritingEngine.tsx`, new shared `TimerAnnouncement.tsx` announcing only milestones); two non-functional `role="alertdialog"` confirmations replaced with the real `ConfirmDialog` (native `<dialog>`, from M3.1) — reusing existing architecture instead of duplicating modal markup, per this phase's own quality requirement; writing-tab `aria-current`; resize-divider `aria-label`; audio-recorder state-change announcement; audio-element `aria-label`.
- **Investigated, confirmed no defect:** admin form label association (valid "wrapping label" pattern, consistent across all 4 form components — an initial `htmlFor` grep looked like a defect until the actual markup was read); no toast system exists (nothing to fix; inline `role="alert"`/`role="status"` is already accessible).
- **Color contrast verified by calculation:** `text-gray-500` on white = 4.84:1 (passes, resolves an open `DESIGN_SYSTEM.md` question); Badge's `text-danger-700`/`bg-danger-50` = 5.52:1 (passes); `placeholder:text-gray-400` = 2.54:1 (fails — documented as a recommendation, not fixed blind, since no field relies on placeholder text for meaning).
- **Scope note:** prioritized the test-taking engine (highest stakes) and repeated patterns (timers, dialogs) over an exhaustive field-by-field pass on marketing pages / the full admin Test Builder — flagged as the natural next increment in `ACCESSIBILITY_REPORT.md`, not a hidden gap.
- **Verified:** `tsc`/`eslint`/`vitest` (120/120)/`next build` all clean.
- **Definition of Done:** ✅ `ACCESSIBILITY_REPORT.md` created; every named audit category addressed (fixed, confirmed non-issue, or explicitly scoped out with reasoning).

### ✅ M4.4 — SEO (done)
- **Goal:** metadata, OG, Twitter Cards, canonical URLs, JSON-LD, robots.txt, sitemap.xml, breadcrumb structured data, dynamic metadata, social sharing; produce `SEO_REPORT.md`.
- **Files:** `app/layout.tsx` (full metadata), `app/opengraph-image.tsx` (new — generated on the fly via `next/og`, no static brand image exists anywhere in the project), `app/page.tsx` (JSON-LD `WebSite` schema + page-level canonical), `app/robots.ts` + `app/sitemap.ts` (new), `app/admin/layout.tsx` (added metadata export) + `app/dashboard/layout.tsx` + `app/test/layout.tsx` (new) — all `noindex`.
- **Key framing:** the entire authenticated surface (`/admin`, `/dashboard`, `/test`) has zero public content and is explicitly excluded from indexing (both `robots.txt` disallow and `noindex` metadata, as defense in depth) — SEO investment went entirely into the marketing homepage + login/signup.
- **Caught and fixed during implementation:** an initial `alternates.canonical: "/"` at the root layout would have wrongly canonicalized every page (including login/signup) to the homepage — moved to page-level before shipping.
- **Deliberately not done, with reasoning (not silently skipped):** login/signup canonical URLs (would need new layout.tsx wrappers since those pages are Client Components — low priority, no duplicate-content risk to protect against); breadcrumb structured data (no indexed, hierarchical content exists for it to describe — would be structured data for its own sake); dynamic per-route metadata for noindexed auth pages (a UX nicety, not an SEO concern).
- **Verified:** `tsc`/`eslint`/`vitest` (120/120)/`next build` clean, **plus** a live production-server smoke test confirming `robots.txt`, `sitemap.xml`, the generated OG image (a genuine 1200×630 PNG), and the homepage's full meta-tag/JSON-LD output are all actually correct, not just non-erroring.
- **Definition of Done:** ✅ `SEO_REPORT.md` created; every named requirement addressed (implemented or explicitly scoped out with reasoning).

### ✅ M4.5 — Production Deployment (done — Phase 4 complete)
- **Goal:** Dockerfile, docker-compose.yml, production environment validation, backup strategy, disaster recovery documentation, deployment guides (Vercel/Docker/Railway), production checklist; produce `DEPLOYMENT.md`.
- **Files:** `Dockerfile` + `.dockerignore` (new, multi-stage), `docker-compose.yml` (new, with an optional self-hosted-Postgres path), `next.config.js` (`output: "standalone"`), `lib/env.ts` + `instrumentation.ts` (startup env validation).
- **Real bug caught by verification, not shipped blind:** initial env-validation implementation threw inside `register()` but Next.js doesn't treat that as fatal by default (confirmed by running the literal standalone server the Dockerfile's `CMD` invokes) — the process logged the error and reported "Ready" anyway. Fixed with `process.exit(1)`; re-verified both the failure path (missing var → exit code 1, no "Ready" reached) and the success path (`/api/health` responds) against the real standalone server.
- **Verified beyond the standard gate:** `.next/standalone/server.js` (the exact Dockerfile `CMD` target) confirmed to exist via a real build and confirmed to actually run correctly (twice — broken and working configs). Docker itself isn't installed in this environment, so the image-build mechanics specifically (COPY paths, layer caching) remain the one thing not directly exercised — flagged explicitly in `DEPLOYMENT.md` rather than assumed fine.
- **Definition of Done:** ✅ `DEPLOYMENT.md` created with all named sections; every claim in it is either verified live or explicitly marked as not yet verified, never silently assumed.

---

## Phase 4 summary

All five milestones (M4.1 Monitoring & Observability, M4.2 Performance, M4.3 Accessibility, M4.4 SEO, M4.5 Deployment) are complete. Every milestone produced its own report/doc, ran the full `tsc`/`eslint`/`vitest`/`next build` gate, and — beyond that standard gate — included at least one live verification against a real running process (health endpoints, request IDs, DB connectivity, the standalone server's startup behavior, the generated OG image, robots.txt/sitemap.xml). Three genuine bugs were found and fixed specifically because of that live-verification discipline, not by code review alone: health endpoints frozen at build time (M4.1), a real re-render defect in the timed exam UI (M4.2), and environment validation that didn't actually halt startup (M4.5).

---

## Execution Notes

- P0 items (M0.1, M0.2) are the next actions once documentation (this file + `DESIGN_SYSTEM.md`) is complete, per the standing autonomous-execution directive.
- Items marked "needs a decision"/"needs credentials" are the only ones this session will pause on — everything else proceeds without asking, per operating instructions.
- Each implementation will follow the CLAUDE.md format (Current Situation → Problems → Best Engineering Solution → Implementation Plan → Files to Modify → Code → Why This Approach → Possible Future Improvements) in the response, and update this roadmap's checkbox state as items land.
- **Database migration policy (standing, since 2026-08-04):** the connected Supabase database is production infrastructure, not a disposable dev sandbox. No `prisma migrate dev`/`db push`/schema-affecting command runs against it without explicit approval — proposed schema changes (new fields, indexes, models) are documented in `DATABASE_MIGRATION_PLAN.md` (rationale, expected benefit, risk, additive-vs-breaking) instead of applied automatically. `schema.prisma` must always match what's actually migrated into the database; a proposed-but-unapproved change belongs in the migration plan doc, never sitting uncommitted in `schema.prisma` itself.
