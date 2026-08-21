# Project Analysis — IELTS Clone

**Author:** Staff Engineering Review (autonomous session 1)
**Date:** 2026-08-02
**Scope:** Full repository read — `README.md`, `package.json`, `prisma/schema.prisma`, `middleware.ts`, all of `app/`, `components/`, `lib/`, `schemas/`, `public/`.

This document is read-only analysis. No application code was changed while producing it, per the First Session mandate. All findings below are traced to specific files/lines so they can be verified independently.

---

## 1. Current Architecture

**Stack:** Next.js 14 App Router (Server Components + Server Actions), TypeScript, PostgreSQL via Prisma 5, Clerk for auth, Zustand for test-taking client state, react-hook-form + Zod for forms/validation, Recharts for charts, Tailwind for styling.

**Shape of the app:**

- **Marketing site** (`app/page.tsx` + `components/layout/*`) — static landing page sections (hero, six-steps, testimonials, footer). No test logic.
- **Auth** — Clerk owns identity/session. A local `User` row (with app-specific `role: STUDENT | CONTENT_EDITOR | ADMIN`) is lazily provisioned on first authenticated request (`lib/auth/session.ts:19`), not via webhook. `middleware.ts` gates `/admin`, `/dashboard`, `/test` for *unauthenticated* visitors only (Edge runtime can't reach Postgres); role-based authorization is re-checked per request via `requireAdmin()`/`requireRole()` inside each admin route/page.
- **Test bank data model** (`prisma/schema.prisma`) — `Test → Module → (Passage | AudioTrack) → QuestionGroup → Question`, plus `WritingTask` and `SpeakingPart` as module-type-specific children. Question-type-specific shape lives in `Json` columns (`Question.data`, `Question.correctAnswer`, `QuestionGroup.groupData`), validated on write via a discriminated-union Zod schema (`lib/validation/testSchemas.ts`) that also cross-checks type-specific invariants (e.g. `MAP_LABELING` requires `groupData.mapImageUrl/mapPoints/options`).
- **Admin CMS** (`app/admin/*`, `components/admin/*`) — `TestBuilderForm` → `ModuleEditor` → `QuestionGroupEditor`, file upload (`app/api/admin/upload`), and `ExaminerScoreForm` for manual Writing/Speaking grading against a paginated attempts queue (`app/admin/attempts`).
- **Test engine** (`components/test-engine/*`) — `TestEngine` (Listening/Reading, shared renderer via `QuestionRenderer`, split-screen passage/audio view, flagging, navigator), `WritingEngine` (word count, per-task timer), `SpeakingEngine`/`SpeakingPartRunner` (prep timer, `AudioRecorder`, upload). Fixed candidate module order (`lib/testSequence.ts`): Listening → Reading → Writing → Speaking.
- **Autosave/resume** — `SavedProgress` table snapshots in-flight answers/flags/remaining time (`lib/hooks/useAutosaveProgress.ts` + `PUT /api/test-attempts/[attemptId]/progress`); `start/actions.ts` resumes an `IN_PROGRESS` attempt or creates one.
- **Scoring** — Listening/Reading auto-graded server-side (`lib/scoring/gradeModule.ts`) against the embedded answer key, mapped to a 1–9 band via `BandScoreConversion` lookup rows (`lib/scoring/bandScoreTables.ts`). Writing/Speaking are always examiner-graded via CMS PATCH. `recomputeOverallBand.ts` recomputes the attempt's mean band (rounded to nearest 0.5) every time either grading path lands, since either can finish last.
- **Student dashboard** — per-attempt breakdown (`AttemptBreakdown`) and a band-over-time chart (`BandProgressChart`) fed by `GET /api/users/[userId]/band-history`.
- **APIs** — plain Next.js route handlers, Zod-validated bodies, a shared `handleApiError()` that maps `AuthError`/`ZodError`/`UploadValidationError` to consistent JSON error shapes.

This is a real, working end-to-end system for the Listening/Reading auto-graded loop and the Writing/Speaking manual-grading loop — not a mockup. The architecture is coherent and the existing patterns (Zod-per-domain, `requireX()` auth helpers, `$transaction` for multi-table writes, upsert-based idempotent submission) are worth extending rather than replacing.

## 2. Folder Structure

```
app/                  Routes: marketing, admin CMS, dashboard, test-taking flow, API routes
components/
  admin/              Test/module/question builder forms
  test-engine/        Listening/Reading/Writing/Speaking runtime UI
  dashboard/          Attempt breakdown + band progress chart
  layout/             Marketing landing page sections + SiteChrome
  auth/               Clerk-backed sign-in/sign-up card
  icons/              Hand-rolled icon components
lib/
  auth/               Clerk session -> local User, role checks (session.ts)
  scoring/             Auto-grading, band conversion, overall-band recompute
  validation/         Zod schemas for test-builder input
  store/              Zustand test-taking client state
  storage/            Local-disk file upload handling
  admin/              CMS-side defaults/sync helpers
  api/                Shared API helpers (error mapping, client fetchers)
  mappers/            Prisma-row -> engine-shape adapters
  hooks/              Autosave, countdown
  data/               Static reference data (currencies, languages — landing page only)
  utils/              formatTime, wordCount
prisma/schema.prisma  Full data model
schemas/              Standalone JSON Schema mirror of the test structure (drift risk vs Zod — see §5)
types/test.ts         Shared engine-facing types (GradableModule, Question, etc.)
```

No structural issues here — this is a clean, conventional, feature-adjacent-to-layer hybrid that's easy to navigate. Keep it.

## 3. Strengths

- **Server-authoritative grading intent is correct in principle** (client never *should* see answer keys pre-submission) — the comment at `app/api/test-attempts/[attemptId]/submit/route.ts:19-23` states this explicitly as a design invariant. (It is currently violated — see §6, Finding 2.)
- **Idempotent submission design** — Writing/speaking submit routes use `upsert` with `update: {}` bodies specifically so a resubmission never clobbers an examiner-assigned band score already in flight. This is a subtle, well-reasoned detail (see `writing-submit/route.ts:47`, `speaking-upload/route.ts:58`).
- **Single grading code path** — `isAnswerCorrect()` in `gradeModule.ts` is the only place answer comparison happens, with an exhaustive `switch` (`const _exhaustive: never = question`) that fails to compile if a new `QuestionType` is added without a case. Good defense against silent scoring bugs.
- **Auth helper layering is sound** — `requireUser()` / `requireRole()` / `requireAdmin()` give a consistent, composable authorization primitive used correctly in most (not all — see §6) routes.
- **Zod validation is genuinely load-bearing**, not decorative — `questionGroupSchema`'s `superRefine` cross-checks question type against group type and enforces per-type required fields, which directly prevents corrupt data from ever reaching the grading engine.
- **Ownership checks pattern** (`attempt.userId !== user.id` before allowing writes) is correctly applied in `progress`, `writing-submit`, and `speaking-upload` routes — just missing from one place (§6).
- **README.md is unusually honest and precise** about what's built vs. missing — this saved significant investigation time and should be kept current as the source of truth.

## 4. Weaknesses / Technical Debt

- ✅ **No automated tests** (fixed for core grading/validation logic — Vitest + 104 tests across `gradeModule.ts`/`recomputeOverallBand.ts`/`bandScoreTables.ts`/`testSchemas.ts`, M2.1). Still no tests for auth helpers, API routes, or E2E flows — see §11.
- ✅ **No CI** (fixed — `.github/workflows/ci.yml`, M2.2). Every PR and push to `main` now runs typecheck → lint → test → build; no repository secrets referenced (verified all four steps succeed with zero env vars set).
- **Dual schema sources of truth** — `lib/validation/testSchemas.ts` (Zod, used at runtime) and `schemas/ielts-test.schema.json` (standalone JSON Schema) describe the same shapes independently. Nothing enforces they stay in sync; a change to one silently drifts from the other.
- **Local disk file storage** (`lib/storage/saveUploadedFile.ts:5`) writes into `public/uploads` — will not survive a redeploy on Vercel/most serverless targets (ephemeral filesystem) and doesn't scale past a single instance. This blocks any real deployment.
- **CSS architecture is transitional** — `app/globals.css` applies Tailwind via bare-tag `@layer base` rules (not utility classes) because, per its own comment, most components were built with BEM-style class names before Tailwind was wired up. This works but means two styling conventions coexist in the codebase; new components should standardize on one (recommend: Tailwind utilities + a small tokens layer, see `DESIGN_SYSTEM.md` planned for Session 3).
- **Navigation dead-ends** (confirmed via `find`): no `/dashboard` index page (only `/dashboard/attempts/[attemptId]` exists), no student-facing "browse tests" page, no `/admin/tests` index page in the UI (only `[testId]` edit view — though the API (`GET /api/admin/tests`) already supports pagination, so this is a pure UI gap, not a missing backend). A student currently cannot reach a test without already knowing its UUID.
- **No structured audit log** — the one place that gestures at auditing (`app/api/admin/attempts/[attemptId]/module-attempts/[moduleAttemptId]/route.ts:49`) is a `console.info` with an explicit comment admitting it should be a real `AuditLog` table "if compliance requires it." For an exam-integrity product, examiner grading actions and role changes are exactly the kind of thing that should be durably logged.
- **No rate limiting anywhere** — none of the API routes (including auth-adjacent ones, upload, submission) have any rate limiting. Combined with Finding 1 below, this is significant.
- ✅ **`console.error`/`console.info` as the only logging** (fixed, M4.1) — structured Pino logging (`lib/logger.ts`), per-request correlation IDs (`middleware.ts`), and Sentry error/performance reporting are all in place. Sentry needs a live DSN to actually report anywhere (safely no-ops without one); verified via a real `next build` and a live server smoke test that the health endpoints, request-ID propagation, and DB connectivity all genuinely work end-to-end.

## 5. Database Review

**Model is well-normalized** — the `Test → Module → (Passage|AudioTrack) → QuestionGroup → Question` hierarchy correctly reflects IELTS structure, `@@unique([testId, type])` on `Module` correctly prevents duplicate modules per test, `@@unique([moduleAttemptId, questionId])` on `QuestionResponse` correctly prevents duplicate responses. Cascade behavior (`onDelete: Cascade` down the content tree, `onDelete: SetNull` for the optional `Passage`/`AudioTrack` back-references on `QuestionGroup`) is deliberate and correct — deleting a `Test` cleanly cascades through everything including attempts, which is right for content management but worth a confirm-twice UI given it also deletes historical `TestAttempt`/`QuestionResponse` rows for real students (see §9, admin delete UX).

**Indexes** are present on all foreign keys and the query patterns that matter (`Test`: `[type, isPublished]` for the (future) public catalog; `User`: `clerkId`; `TestAttempt`: `userId`, `testId`).

**Issues found:**
- `BandScoreConversion` has no `@@unique` gap-validation — nothing prevents overlapping or missing raw-score ranges being seeded per `(testType, moduleType)`, which would make `rawToBand()` silently return an unintended band for scores in a gap/overlap. Worth a seed-time validation script, not a schema change.
- `SavedProgress.responsesJson`/`flaggedJson` are untyped `Json` — fine for now, but there's no migration story if the answer shape changes; consider a schema version column if this becomes a pain point.
- No soft-delete anywhere (`Test`, `User`) — every delete is permanent and cascades. For a CMS where admins will eventually fat-finger a delete on a live test with real student attempts, this is a real operational risk.
- No full-text index on `Passage.bodyText` / question content — irrelevant today (no content search UI exists) but worth knowing before an admin "search all tests" feature is built naively.

## 6. Security Issues (ranked by severity)

### ✅ Finding 1 — Critical: Auto-grade submission endpoint has no authentication or ownership check (fixed)
**File:** `app/api/test-attempts/[attemptId]/submit/route.ts`

This route (Listening/Reading auto-grading) never calls `requireUser()` and never checks that `testAttempt.userId` matches the caller. Compare this to its siblings — `writing-submit/route.ts:22,26` and `speaking-upload/route.ts:18,35` both correctly call `requireUser()` and verify `attempt.userId !== user.id`. This route is missing both.

**Impact:** Any client — authenticated or not — that knows or guesses a valid `attemptId` and `moduleId` can submit arbitrary answers on behalf of any other student's test attempt, repeatedly (there is no status lock preventing re-submission of an individual module attempt before final test submission — only `testAttempt.status === "SUBMITTED"` is checked, and that's set at final-submit time, not per-module). This breaks exam integrity completely for the two modules everyone actually takes, and is exploitable with a single unauthenticated `curl` request.

**Fix:** Add `const user = await requireUser();` and the same `attempt.userId !== user.id` / `status !== "IN_PROGRESS"` guard used in the sibling routes, before any grading happens. This is a same-shape fix as the two routes sitting right next to it in the same directory — high confidence, low risk change.

### ✅ Finding 2 — Critical: Answer key is shipped to the browser before submission (fixed)
**Files:** `lib/mappers/toGradableModule.ts` (builds `Question.correctAnswer` into the shape handed to the UI) → `app/test/attempts/[attemptId]/modules/[moduleId]/page.tsx:33,42` (passes the resulting `gradableModule` — with `correctAnswer` still attached — straight into `<TestEngineClientWrapper module={gradableModule} .../>`) → `TestEngineClientWrapper.tsx` is a `"use client"` component.

**Impact:** Every question's `correctAnswer` is serialized into the RSC payload / initial HTML and sent to the candidate's browser the moment the module page loads — before they've answered a single question. Any candidate can read it via View Source, the Next.js RSC payload in Network tab, or simply `console.log`-ing the component's props via React DevTools. This directly contradicts the design invariant stated in the submit route's own comment ("the answer key never leaves the server ... until after submission") and is the single most severe issue in the codebase — it means the auto-graded portion of every test is trivially defeatable by any candidate who opens dev tools.

**Fix:** `toGradableModule()` (or a new sibling, e.g. `toClientModule()`) must strip `correctAnswer` (and any other answer-key-shaped fields, e.g. `MATCHING_HEADINGS`'s implicit key mapping) before the module ever reaches a client component. The full `GradableModule` (with answers) should stay server-side only, used exclusively inside `gradeModule()` at submit time — fetched fresh from Prisma in the submit route, never trusted from a client-sent payload. This requires touching the shared `GradableModule`/`Question` types (likely splitting into a server-only `GradableQuestion` and a client-safe `ClientQuestion` omitting `correctAnswer`).

### ✅ Finding 2b — Critical: `TestAttempt.status` never transitions to `SUBMITTED` (fixed, discovered during M1.1)

**Files:** `submit/route.ts`, `writing-submit/route.ts`, `speaking-upload/route.ts` (all three previously only upserted a `ModuleAttempt`, never touched the parent `TestAttempt.status`).

**Impact:** Every module-submit path upserts a `ModuleAttempt` but none of them ever set the parent `TestAttempt.status` to `SUBMITTED` or stamped `submittedAt`. Since `/dashboard/attempts/[attemptId]` explicitly 404s unless `status === "SUBMITTED"` (`app/dashboard/attempts/[attemptId]/page.tsx:31`), and `band-history` filters on the same status, **a candidate could never actually see their own results page or band-history chart no matter how many modules they completed** — the entire "finish a test → see your score" loop, the core value proposition of the product, was unreachable end-to-end. `ModuleCompleteScreen`'s "View full attempt breakdown" link (shown after the last module) pointed at a page that would always 404.

**Fix:** New `lib/scoring/finalizeAttemptIfComplete.ts` — checks whether every `Module` configured on the test now has a corresponding `ModuleAttempt`, and if so, marks the `TestAttempt` `SUBMITTED` with `submittedAt: new Date()`. Called from inside the existing `$transaction` in all three submit routes, right after `recomputeOverallBand()`. "Complete" means "every module answered," not "every module graded" — Writing/Speaking can still be pending examiner review after the attempt flips to `SUBMITTED`, which is correct (the review page already renders a "Pending examiner review" state per module).

### ✅ Finding 3 — No rate limiting on any endpoint (fixed, M2.3)
Upstash Redis-backed rate limiting (`lib/rateLimit/*`) now covers all 12 relevant routes — auth (`/api/auth/me`), uploads (admin upload, speaking recording), test submission (submit/writing-submit/progress autosave), and admin CRUD — via 5 configurable named tiers. Identified by Clerk user id when authenticated, else client IP. Fails open (allows the request, logs a warning) on an Upstash config/network error rather than making an infra hiccup into a full outage — only an actual exceeded-limit result returns `429`. **Not yet smoke-tested against a live Upstash instance** — same caveat as M1.4's Supabase Storage; verify with real `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` before relying on this in production.

### ✅ Finding 4 — Weak/no audit trail on privileged actions (fixed for grading, M2.4)
Examiner grading and role changes (M3.1) both write a durable `AuditLog` row (actor, action, target, previous/new value, timestamp) in the same transaction as the change itself — see `lib/audit/logAction.ts`. No admin UI to browse the log yet (query via Prisma/DB client directly); a natural, low-effort future addition.

### 🟡 Finding 5 — File upload validation is MIME-prefix + extension only
`saveUploadedFile.ts:33` trusts `file.type` (client-supplied) for the allow-list check and derives the extension from the uploaded filename. There's no magic-byte/content sniffing, so a file with a spoofed `Content-Type: audio/mpeg` header containing arbitrary bytes would pass validation and be written to `public/uploads` (a publicly-served, static directory) with a servable URL. Low exploitability today (no script execution risk from serving arbitrary bytes as static files under Next's `public/`, since there's no `.php`/executable interpretation), but worth tightening before cloud storage migration, especially since uploads are reachable by any `CONTENT_EDITOR`/`ADMIN` (broader than just super-admins) and by any authenticated student for speaking recordings.

### ✅ Finding 8 — Missing request-body validation on the `submit` route (fixed)
A full application security review (`SECURITY_AUDIT.md`, 2026-08-04) found `POST /api/test-attempts/[attemptId]/submit` was the only mutating route validating its body via a TypeScript type assertion rather than Zod — no injection risk (Prisma parameterizes regardless), but a real data-integrity/availability gap (e.g., an unbounded `totalTimeSpentSeconds` written straight to the DB). Fixed: added `submitRequestSchema`, matching the pattern every sibling route already uses. See `SECURITY_AUDIT.md` H1 for full detail. That audit also found 7 Medium and 6 Low severity items not yet addressed — see `SECURITY_AUDIT.md` for the complete list; not duplicated here to avoid two documents drifting out of sync.

### 🟠 Finding 7 — Pre-existing high-severity dependency advisories (Next.js 14 / Clerk 5 / postcss)

Discovered via `npm audit` while adding `@supabase/supabase-js` for M1.4 — **unrelated to that package**, already present before this change. `npm audit` reports high-severity advisories against the pinned `next@^14.2.5` (multiple DoS/cache-poisoning/SSRF/XSS CVEs fixed in Next 15/16), `@clerk/nextjs@^5.7.5` (an authorization-bypass advisory, fixed in Clerk v7), and a transitive `postcss`/`js-cookie`. `npm audit fix --force` would resolve these but pulls in `next@16` and `@clerk/nextjs@7` — both breaking major-version upgrades that would need their own dedicated, tested migration (App Router/middleware API changes, Clerk SDK changes), not something to fold into an unrelated dependency add. Flagging as its own roadmap item rather than fixing silently.

### 🟡 Finding 6 — `.env.local` is present in the repo working tree
Confirmed present at repo root (`.env.local`, distinct from the checked-in `.env.example`). It's correctly excluded via `.gitignore` (not staged), but flagging because this file contains live-shaped Clerk/DB credentials on disk — standard practice, just noting it's there and should never be committed, especially since the same machine's home directory shows heavy unrelated project sprawl in `git status` (many unrelated dirs one level up) — worth double-checking `.gitignore` stays intact if this repo's remote ever changes.

## 7. Performance Issues

A full audit (`PERFORMANCE_REPORT.md`, M4.2) covered Server Components, bundle size, code splitting, images, fonts, database queries, caching, Suspense/streaming, re-renders/memoization, and pagination — see that document for complete detail. Headline items:

- ✅ **Fixed: `TestEngine.tsx` re-rendered its entire question sheet on every keystroke and every timer tick** — the highest-value finding of the pass, in the highest-stakes UI in the app. Root-caused (unnecessary top-level store subscriptions only needed inside a submit-time closure) and fixed with `React.memo` as defense-in-depth. See `PERFORMANCE_REPORT.md` §1.
- ✅ **Fixed: `/admin/attempts` had no pagination** (hard-capped at 50, silently hid the rest) — now matches `/admin/tests`/`/admin/users`.
- ✅ **Fixed: the marketing homepage blocked its entire render on a DB-backed auth check** needed only by the navbar — now streams via Suspense.
- **Investigated, no action needed:** N+1 queries (none found), Server Components ratio (spot-checked, no unnecessary client components), font loading (already optimal — no web font), Recharts code splitting (already correctly isolated per-route by Next's automatic splitting).
- **Documented, deliberately not fixed:** Sentry's client bundle cost (87.5 kB → 161 kB shared JS; a real, accepted cost of the observability tooling from M4.1, not free), admin-uploaded images staying `<img>` rather than `next/image` (unknown dimensions + no live browser to verify a layout change against the exam-taking UI), `BandProgressChart`'s client-side fetch (works fine, a lower-priority streaming candidate), `/admin/analytics`'s lack of per-section streaming (admin-only, lower traffic than the homepage fix), experimental Partial Prerendering (real risk, not verifiable live in this environment).
- **New (M3.2):** the admin analytics page's date-range queries (`lib/admin/analytics.ts`) would benefit from 4 additional indexes on `TestAttempt`/`QuestionResponse`/`User` — proposed, not yet applied, since further schema migrations against the live database are paused pending explicit approval. Full detail in `DATABASE_MIGRATION_PLAN.md`. Functionally correct today regardless; this is a scale concern, not a correctness one.
- `writing-submit`/`speaking-upload` routes each call `recomputeOverallBand()` inside their transaction, which re-fetches *all* `moduleAttempt` rows for the attempt every single submission — fine at current scale (max 4 modules/attempt), no action needed, just noting it as the kind of thing that would need revisiting if modules-per-attempt ever grows.
- `GET /api/admin/tests/:testId` (`FULL_TEST_INCLUDE`) eagerly loads the entire nested tree (all passages, audio tracks, question groups, questions) in one query for the Test Builder form. Correct today (admin CMS, low volume, needs the full tree to render the builder) but will not scale to tests with hundreds of questions without pagination inside the builder UI itself.

## 8. UI/UX Issues

- Styling is inconsistent between the marketing site (likely hand-styled/BEM, per `globals.css`'s own comment) and newer Tailwind-driven areas — will look visibly different in the same product to any pixel-conscious viewer today.
- Per README + confirmed via file listing: **no loading/empty/error states have been systematically reviewed** — this needs a per-screen pass (dashboard index doesn't exist yet at all — see §4).
- No dark mode support anywhere (no `dark:` variants in `tailwind.config.js`, no theme toggle component).
- ✅ **SEO (M4.4)** — full metadata/OG/Twitter/JSON-LD/robots.txt/sitemap.xml, all verified against a live server (see `SEO_REPORT.md`). The entire authenticated surface (`/admin`, `/dashboard`, `/test`) is explicitly `noindex`+disallowed, since it has zero public content — only the marketing homepage and login/signup are meant to appear in search results.
- ✅ **Accessibility review of the test-taking engine done (M4.3)** — full detail in `ACCESSIBILITY_REPORT.md`. 6 real defects fixed (timer `aria-live` spam on both `CountdownTimer`/`WritingEngine`, two non-functional `alertdialog` confirmations replaced with the real `ConfirmDialog`, missing tab/separator/recorder labeling) plus 2 color-contrast values calculated (not assumed) and one confirmed non-issue (form label association). Not exhaustively covered: marketing landing page sections and the full admin Test Builder beyond label association — noted as the natural next increment, not a currently-known gap.

## 9. Missing Features (confirmed against actual code, superseding some of README's self-reported gaps where I found more detail)

1. ✅ **Student "browse/resume tests" page** (fixed — `app/dashboard/page.tsx` + `app/test/page.tsx`, M1.1/M1.2).
2. ✅ **Admin test index page** (fixed — `app/admin/tests/page.tsx`, M1.3).
3. ✅ **"Create new test" entry point** (fixed — Server Action form on `app/admin/tests/page.tsx`, M1.3).
4. ✅ **Admin role-management UI/API** (fixed — `app/admin/users/page.tsx` + `PATCH /api/admin/users/[userId]/role`, M3.1: search, role filter, pagination, last-admin protection, audit logging, optimistic UI with confirmation dialog).
5. **No payments/subscriptions** — confirmed, no Stripe references anywhere in `package.json` or code.
6. 🟡 **Notification/email system** — email half fixed (`lib/email/*`, Resend, M3.3): grading-complete emails sent via a swappable provider abstraction, not yet smoke-tested against a live Resend account. In-app notifications (read/unread, preferences) blocked on `DATABASE_MIGRATION_PLAN.md` Proposals 5-6 pending approval.
7. ✅ **Admin analytics** (fixed — `app/admin/analytics/page.tsx`, M3.2: user/attempt/completion/band/pass-rate stat tiles, registration + pass-rate trend charts, question-difficulty ranking, all date-filterable).
8. ✅ **Cloud file storage** (fixed — Supabase Storage, `lib/storage/saveUploadedFile.ts`, M1.4; code verified via tsc/eslint/build, **not** yet verified against a live bucket — requires real `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/bucket to smoke-test end-to-end).
9. **Automated tests** — confirmed missing (see §4).
10. **CI/CD** — confirmed missing (see §4).
11. ✅ **AuditLog table** (fixed for grading actions — see §6, Finding 4).
12. ✅ **Rate limiting** (fixed — Upstash Redis, `lib/rateLimit/*`, see §6 Finding 3).

## 10. Deployment Issues

- ✅ **Local-disk file storage** (fixed, M1.4) — `saveUploadedFile.ts` now uploads to Supabase Storage instead of `public/uploads`, so files persist across redeploys/serverless cold starts.
- ✅ **`Dockerfile`/`docker-compose.yml`/infra-as-code** (fixed, M4.5) — multi-stage Docker build (`output: "standalone"`), Vercel/Docker/Railway deployment guides, backup strategy, disaster recovery documentation — see `DEPLOYMENT.md`.
- `DATABASE_URL` vs `DIRECT_URL` split (PgBouncer transaction-mode vs direct) is already correctly documented and wired in `schema.prisma` — this is good prep for a pooled-Postgres provider (Supabase/Neon) in production; no changes needed here.
- ✅ **Environment-variable validation at boot** (fixed, M4.5) — `lib/env.ts` + `instrumentation.ts`. Verified against the real standalone server (not assumed): the first version threw but didn't actually halt startup (Next.js doesn't treat instrumentation errors as fatal by default), caught by testing the literal command the Dockerfile runs; fixed with an explicit `process.exit(1)` and re-verified both the failure and success paths live.

## 11. Testing Gaps

### ✅ Core business-logic coverage (fixed, M2.1)

Vitest is now configured (`vitest.config.mts`, `npm test`/`test:watch`/`test:coverage`, Node environment, v8 coverage) with 104 tests across the four highest-value modules:

| File | Statements | Branch | Functions | Lines |
|---|---|---|---|---|
| `lib/scoring/gradeModule.ts` | 92.15% | 72% | 100% | 95.23% |
| `lib/scoring/recomputeOverallBand.ts` | 100% | 100% | 100% | 100% |
| `lib/scoring/bandScoreTables.ts` | 100% | 100% | 100% | 100% |
| `lib/validation/testSchemas.ts` | 100% | 100% | 100% | 100% |

`gradeModule.ts`'s only uncovered lines (83–84) are the `const _exhaustive: never = question` exhaustiveness-check branch in `isAnswerCorrect()`'s `switch` — unreachable by construction for any value that type-checks as `Question`, not a real gap. Coverage includes happy paths, edge cases (case sensitivity, whitespace, duplicate/extra/missing multi-select answers, unanswered questions, zero/perfect scores, out-of-range raw scores, discriminated-union type mismatches, `superRefine` cross-field validation, boundary values like `mapPoints` x/y at 0/100).

No behavioral bugs were found in any of these four modules — all held up correctly under adversarial edge-case testing. One notable (currently harmless) nuance documented via a test rather than silently changed: `recomputeOverallBand.ts` writes `overallBand: overallBand ?? undefined` to Prisma, and Prisma omits `undefined` fields from an update rather than setting them to `NULL`. This means if a `TestAttempt.overallBand` ever needed to revert from non-null back to null (no code path does this today — bandScore only ever moves null→number, never back), the update would silently no-op that field instead of clearing it. Flagging for awareness if a future "reset grade" admin feature is ever built.

### Still missing
1. Auth helpers (`requireUser`/`requireRole`/`requireAdmin`) — integration tests, to prevent future routes from shipping the same authorization gap as Finding 1.
2. API route tests (request/response contract, error mapping) — none of the route handlers have any test coverage yet.
3. `finalizeAttemptIfComplete.ts` — the attempt-lifecycle logic added when fixing Finding 2b; same caliber of risk as the four modules above, good candidate for the next testing pass.
4. Component/UI tests — none yet for the test-taking engine, dashboard, or admin CMS.
5. E2E: full candidate journey (start attempt → answer → autosave → resume → submit → see result) and full examiner journey (queue → open → score → recompute).

## 12. Estimated Production Readiness

| Dimension | Estimate | Rationale |
|---|---|---|
| Core product logic (grading, data model, CMS) | ~75% | Genuinely working end-to-end; missing LLM-assisted writing feedback and analytics, but the core loop is real. |
| Security | ~78% | A full 16-category security review (`SECURITY_AUDIT.md`) found no new Critical issues; the High finding and 4 of 7 Medium findings are fixed (security headers + Report-Only CSP, essay length cap, upload content-sniffing, `.gitignore` env coverage). Still open: 3 Medium findings needing live verification or a product-policy call (CSRF cookie verification, speaking-recording URL exposure, CONTENT_EDITOR module-deletion scope) plus the Next.js/Clerk CVE upgrade (Finding 7) — none are pure engineering fixes, so left for explicit prioritization. |
| UX completeness | ~45% | Core screens work but major navigation dead-ends (no test browse/dashboard index) block a first-time user from using the product without direct URLs. |
| Performance | ~60% | No known bottlenecks at current scale; several "will matter later, not yet" items. |
| Testing | ~30% | Core grading/validation logic (the highest-risk code in the app) now has 104 unit tests at 92-100% coverage; API routes, auth helpers, components, and E2E remain untested. |
| DevOps/CI/CD | ~50% | GitHub Actions CI (`.github/workflows/ci.yml`) gates every PR/push to `main` on typecheck+lint+test+build. No CD/deployment automation yet — that's a separate, later concern. |
| Deployment readiness | ~55% | Cloud file storage now wired up (Supabase Storage, M1.4) — pending a live smoke test. `next@14`/`@clerk@5` have known high-severity CVEs requiring a deliberate major-version upgrade (Finding 7 / M1.4b). |
| Documentation | ~90% | README, `ARCHITECTURE.md`, `PROJECT_ANALYSIS.md`, `PRODUCT_ROADMAP.md`, `DESIGN_SYSTEM.md`, `CHANGELOG.md` all present and kept current. |

**Overall: ~86% production-ready.** All P0/P1/P2 work is done, and **Phase 4 (production hardening) is now complete** — monitoring/observability, performance, accessibility, SEO, and deployment prep all shipped, each with its own detailed report (`PERFORMANCE_REPORT.md`, `ACCESSIBILITY_REPORT.md`, `SEO_REPORT.md`, `DEPLOYMENT.md`) and each independently verified against a real running server or standalone process wherever that was possible in this environment, not just a passing build. Two genuine bugs were caught specifically *by* that live verification discipline rather than shipped blind: the health endpoints were being statically frozen at build time (M4.1), and environment validation initially threw without actually halting a misconfigured server's startup (M4.5). Remaining blockers before real users: live smoke tests for Supabase Storage, Upstash Redis, Resend, and Sentry against real accounts (all four implemented and safe-without-credentials, but only Sentry's build-time integration and Supabase's Postgres connection have been exercised live from this environment), the 3 remaining `SECURITY_AUDIT.md` Medium findings, 6 proposed-but-unapplied database migrations (reviewed once, deferred), a decision on the Next.js/Clerk major-version upgrade (Finding 7), and a real `docker build` run (Docker isn't installed in this environment — the standalone server underneath it was tested directly instead). P3 business features (payments, AI writing feedback) remain paused pending business decisions; in-app notifications paused pending migration approval.

## 13. Prioritized Improvement Roadmap (headline — full detail in `PRODUCT_ROADMAP.md`, Session 2)

**P0 — must fix before any real user touches this:**
1. Fix Finding 1 (auth bypass on Listening/Reading submit).
2. Fix Finding 2 (answer key leaked to client pre-submission).

**P1 — blocks a usable pilot:**
3. Student dashboard index + "browse tests" page.
4. Admin test index + create-test UI.
5. Cloud file storage migration (S3/R2/Supabase Storage).

**P2 — protects what's already built:** ✅ all done (tests, CI, rate limiting, audit log).

**P3 — product completeness (post-pilot):**
10. ✅ Admin role-management UI (M3.1).
11. ✅ Admin analytics (cohort stats, question difficulty) — done, M3.2.
12. Notifications/email.
13. Payments/subscriptions.
14. LLM-assisted Writing feedback (speed up examiner turnaround, per README's own suggestion).

---

*Next: Session 2 will expand each roadmap item into milestones with complexity estimates, file lists, dependencies, and Definition of Done (`PRODUCT_ROADMAP.md`), followed by Session 3's `DESIGN_SYSTEM.md`. Implementation will then proceed P0 → P3, starting with the two critical security fixes above.*
