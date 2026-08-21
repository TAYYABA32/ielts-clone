# Architecture

Living document — updated whenever a change alters how the system is put together, not on every commit. See `PROJECT_ANALYSIS.md` for the point-in-time audit this was seeded from, and `PRODUCT_ROADMAP.md` for what's planned.

## System shape

Next.js 14 App Router monolith: marketing site, student dashboard, test-taking engine, and admin CMS all live in one deployable, sharing one Postgres database via Prisma. No separate backend service, no BFF layer — route handlers under `app/api/**` are the entire API surface.

```
Browser
  │
  ├─ Server Components (app/**/page.tsx) ── Prisma ──┐
  │                                                    │
  ├─ Client Components ("use client") ── fetch ──► app/api/**/route.ts ── Prisma ──► Postgres
  │                                                    │
  └─ Clerk (session/identity) ◄──────────────────────┘ (role lives in our User row, not Clerk)
```

## Core boundary: server-only vs. client-safe data shapes

The test engine's Reading/Listening question data has two shapes that must never be conflated:

- **`GradableModule`** (`types/test.ts`) — includes `Question.correctAnswer`. Built by `lib/mappers/toGradableModule.ts` from Prisma rows. **Server-only.** Used exclusively inside `lib/scoring/gradeModule.ts` at submit time. Never pass this to a `"use client"` component or return it from an API route before an attempt is submitted.
- **`ClientGradableModule`** (`types/test.ts`) — same shape minus `correctAnswer`, built by `lib/mappers/toClientModule.ts`. This is the *only* module shape allowed to reach `TestEngineClientWrapper` → `TestEngine` → `QuestionRenderer` → the Zustand test store (`lib/store/testStore.ts`).

This split exists because the answer key was previously being serialized straight into the client bundle (see `PROJECT_ANALYSIS.md` Finding 2) — any new code path that touches question data for Reading/Listening must go through one of these two mappers, never construct an ad hoc shape that smuggles `correctAnswer` client-side.

Grading itself stays server-authoritative: `POST /api/test-attempts/:attemptId/submit` re-fetches the module fresh from Prisma and re-derives `GradableModule` itself — it never trusts an answer key sent by the client (the client only ever sends its own answers).

## Attempt lifecycle

```
TestAttempt.status: IN_PROGRESS ──(every configured Module has a ModuleAttempt)──► SUBMITTED
                        │                                                              │
                        └─ per-module submit (submit / writing-submit / speaking-upload)┘
                             all three call lib/scoring/finalizeAttemptIfComplete.ts
                             inside the same $transaction as their ModuleAttempt upsert
```

`finalizeAttemptIfComplete` is the single place that decides "is this attempt done" — checking it against every `Module` configured on the `Test`, not against band scores (Writing/Speaking can still be pending examiner review when the attempt flips to `SUBMITTED`). Any new module-submission endpoint must call this in the same transaction as its own upsert, or attempts using that path will never reach `SUBMITTED` (this was a real, previously-shipped bug — see `PROJECT_ANALYSIS.md` Finding 2b).

`recomputeOverallBand` (mean of available module bands, rounded to nearest 0.5) runs on the same three paths, independently of finalization — either can be the last piece to land.

## Auth & authorization

- **Identity/session:** Clerk. **App-level role** (`STUDENT | CONTENT_EDITOR | ADMIN`): our own `User` row, looked up per-request — Clerk's session token doesn't carry it.
- **Route-level gate** (`middleware.ts`): Edge-runtime, unauthenticated-visitor redirect only for `/admin`, `/dashboard`, `/test` — cannot check role (Edge can't reach Postgres).
- **Role/ownership checks**: every route/page that needs them calls `requireUser()` / `requireRole()` / `requireAdmin()` (`lib/auth/session.ts`) itself, plus an explicit `attempt.userId === user.id` check wherever a request acts on a specific `TestAttempt`. This is not centralized in middleware by design — do not assume a route is protected just because it sits under `/test` or `/dashboard`; each handler must still check ownership of the specific resource it's touching.

## UI/component layering

- Prefer Server Components; a component only becomes `"use client"` when it needs interactivity/state (form inputs, timers, Zustand). `TestEngineClientWrapper` is the documented pattern for handing a client subtree a value (like `onSubmitted`) that can't cross the server→client boundary as a prop otherwise.
- Shared presentational primitives live in `components/ui/` (e.g. `Badge.tsx`) — introduced when a second screen needs the same status-to-color mapping, not preemptively. See `DESIGN_SYSTEM.md` for the token/component conventions new UI should follow.
- Two styling conventions currently coexist: older screens use hand-rolled BEM class names styled via `app/globals.css`'s `@layer base` tag rules; newer screens (`app/dashboard/page.tsx`, `app/test/page.tsx`) use Tailwind utility classes directly. New pages should use Tailwind utilities + `components/ui/*` primitives; do not add new BEM classes.

## Shared utilities: keep API routes and Server Actions/pages on one code path

Admin mutations/queries are reachable from more than one entry point (a JSON API route *and* a Server Component page or Server Action) — e.g. creating a test happens via both `POST /api/admin/tests` and the `/admin/tests` create form's Server Action; paginating a list happens via both `GET /api/admin/tests`/`GET /api/admin/attempts` and any future paginated admin page. The validate+write logic and the pagination-param parsing each live in one `lib/` helper (`lib/admin/createTest.ts`, `lib/api/pagination.ts`) called from every entry point, rather than being re-implemented per call site. When adding a new admin capability reachable from more than one place, follow this pattern instead of duplicating the logic.

## File storage

Uploaded audio/images (admin content uploads, candidate speaking recordings) go through `lib/storage/saveUploadedFile.ts`, which uploads to **Supabase Storage** (same Supabase project as the database) via a lazily-constructed service-role client (`lib/storage/supabaseClient.ts`). Both call sites (`app/api/admin/upload`, `app/api/test-attempts/[attemptId]/speaking-upload`) depend only on the `(File, options) → { url, mimeType, sizeBytes }` contract, not the storage backend — if the backend ever needs to change again, that function is the one place to touch. Objects are named by a random UUID + extension (never the original filename) and served via `getPublicUrl()` — same "unguessable URL, not access-controlled" visibility model as the local-disk implementation it replaced, not a stricter one.

## Audit logging

Privileged actions (examiner grading today; role changes/content deletion are natural additions later) write a durable `AuditLog` row via `lib/audit/logAction.ts`, called with the same `tx` transaction client as the action itself — so a grade change and its audit entry can never diverge if either half fails partway. `AuditLog.actorId` is deliberately a plain string, **not** a Prisma relation to `User`: deleting a user account must never cascade-delete or orphan audit history, so `actorName`/`actorEmail` are snapshotted at write time instead of joined live. Action names are centralized in `lib/audit/actions.ts` (`AUDIT_ACTIONS`) rather than scattered as magic strings — add new entries there as new privileged actions get audited.

## Analytics aggregation pattern

`lib/admin/analytics.ts` computes every metric via Prisma's `groupBy`/`aggregate`/`count` at the database level — never `findMany` followed by reducing in JavaScript for anything whose size scales with response/attempt count. The one exception (`bucketPassRateByDay`) fetches only the two narrow columns it needs (`submittedAt`, `overallBand`) for rows already filtered to a bounded date range, then buckets in memory — a deliberate, documented trade-off (no raw SQL `date_trunc`, keeping the "no raw queries anywhere" security property from `SECURITY_AUDIT.md`) rather than an oversight. Follow the DB-level-aggregation-first rule for any new analytics metric; only fall back to in-memory bucketing for genuinely small, already-filtered result sets.

## Observability

Three complementary pieces, each with one job — don't blur them:
- **`lib/logger.ts` (Pino)** — structured logs you own (JSON in production, readable in dev). Use for anything you want queryable in your own log aggregator.
- **Sentry (`sentry.*.config.ts`, `instrumentation.ts`)** — error capture + performance tracing. `handleApiError.ts` reports only genuinely unexpected errors (the generic fallback branch) to Sentry; expected 4xx client errors are logged via Pino but never reported, so Sentry stays a signal for real bugs, not a stream of routine validation failures. Sentry's own Next.js SDK auto-instruments route handlers for performance tracing once configured — this is *why* Sentry covers "performance monitoring hooks" too, rather than a second hand-rolled timing system existing alongside it.
- **`lib/observability/requestId.ts`** — one correlation ID per request, generated in `middleware.ts`, readable from any server-side call via `next/headers` (no need to thread a request object through every function signature). Present on every response as `x-request-id`.

All three are safe to ship without live credentials: `Sentry.init()` no-ops without a DSN, Pino always works (no external dependency), and request IDs need no configuration at all. Verified end-to-end against a real running server, not just a build — see `PRODUCT_ROADMAP.md` M4.1.

**Health endpoints:** `/api/health` (liveness, zero dependencies — a slow DB must never make an orchestrator kill a live instance) and `/api/health/ready` (readiness, one real `SELECT 1` against Postgres — the one deliberate exception to "no raw queries," since it's a static string with no user input). **Both must carry `export const dynamic = "force-dynamic"`** — without it, Next.js statically prerenders them at build time and serves one frozen response forever, since neither route reads request-specific data. This was caught during M4.1's own verification, not assumed safe; apply the same export to any future health/status route.

## Security headers & CSP

`next.config.js`'s `headers()` block applies `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` to every route, plus a Content-Security-Policy shipped as **`Content-Security-Policy-Report-Only`**, deliberately not enforcing — this environment can't live-test the policy against the actual deployed Clerk frontend-API domain, and an incorrectly enforcing CSP risks silently breaking auth for the whole app. Before relying on it: confirm zero violations in real browser usage, then rename the header key to `Content-Security-Policy`. Uploaded files are also content-sniffed against their claimed category (`lib/storage/fileSignature.ts`) rather than trusting the client-supplied `Content-Type` alone — extend `IMAGE_SIGNATURES`/`AUDIO_SIGNATURES` there if a new upload format is ever accepted.

## Email

`lib/email/sendEmail.ts` is the one entry point every call site uses — never import `resendProvider`/`consoleProvider` directly. Provider selection (`EMAIL_PROVIDER` env var, defaulting to Resend, auto-falling-back to a logging-only console provider when `RESEND_API_KEY` is unset) lives entirely inside `sendEmail.ts`, so adding a new provider (Postmark, SES) means one new file implementing `EmailProvider` (`lib/email/types.ts`) plus one branch in `getProvider()` — no call site ever changes. `sendEmail()` itself never throws: email delivery is deliberately decoupled from whatever business action triggered it, and is always called *after* that action's transaction commits, never from inside one. This app has no reliable "run after the response" primitive (checked: this Next.js version doesn't export `unstable_after`), so `sendEmail()` is awaited rather than fire-and-forget — the only way to reliably guarantee the send completes before a serverless function instance might be torn down.

## Store subscriptions: only select what you render

`lib/store/testStore.ts` selectors follow a strict rule, tightened after a real bug (`PERFORMANCE_REPORT.md` M4.2): **a component should only call `useTestStore((s) => s.x)` for a value it actually reads in its own JSX.** A value needed only inside an event handler's closure (e.g. a submit handler reading the current answers at call-time) should be read via `useTestStore.getState().x` at the point it's used, not subscribed reactively at the component's top level — a reactive subscription re-renders the *whole component* (and, unless children are `memo`-wrapped, everything beneath it) every time that value changes, whether or not anything visible actually needs to update. `TestEngine.tsx`'s `handleSubmit` is the reference example. Components that render a large, mostly-static subtree fed by a prop that's stable after mount (`ReadingPassagePane`/`ListeningAudioPane`/`QuestionSheetPane`) are wrapped in `React.memo` as a second line of defense, not a substitute for the first rule.

## Streaming: don't let one dynamic piece block a static page

`app/page.tsx` + `components/layout/NavbarAsync.tsx` is the reference pattern for "one component needs a DB round-trip, the rest of the page doesn't": extract the dynamic piece into its own async Server Component, wrap it in `<Suspense fallback={...}>`, and let Next's streaming SSR flush the static shell immediately. This does not make the route statically cacheable (the route as a whole is still dynamic — Suspense affects *streaming order*, not build-time static eligibility, without the experimental Partial Prerendering flag, which isn't enabled here), but it does mean visitors aren't held hostage to the slowest component's data fetch before seeing anything. Reach for this pattern when a page has both fully-static content and one narrow dynamic dependency — not for pages that are dynamic throughout anyway (nothing to gain there).

## Accessible live regions: announce milestones, not every tick

`components/test-engine/TimerAnnouncement.tsx` is the reference pattern for any per-second (or otherwise rapidly-changing) value that also needs to be screen-reader-accessible: **never put `aria-live` directly on the element that updates every tick** — it either spams the announcement constantly or gets silently throttled/dropped by the assistive tech, and there's no good outcome either way. Instead, keep the visible, rapidly-updating value as plain (non-live) text, and add a separate visually-hidden live region that only changes text at meaningful milestones (a crossed-threshold comparison against the previous value, not exact-value matching, so a skipped tick can't cause a missed announcement). `AudioRecorder.tsx`'s state-transition announcer follows the same shape for discrete state changes (keyed by `status`, never by an elapsed-time counter).

Every confirmation dialog in the test-taking engine uses `components/ui/ConfirmDialog.tsx` (native `<dialog>`) — do not hand-roll a `<div role="alertdialog">` for a new confirmation flow. A plain div with `aria-modal="true"` doesn't provide the focus-trapping/Escape-handling/focus-return that attribute implies; two call sites did exactly that until M4.3 and were migrated to the shared component instead of patched in place.

## SEO: index the marketing surface, exclude everything else

The site splits cleanly into "has public content" (`/`, `/login`, `/signup`) and "auth-gated, zero public content" (`/admin`, `/dashboard`, `/test` — all behind `middleware.ts`). Every auth-gated route subtree carries `robots: { index: false, follow: false }` on its `layout.tsx` (see `app/admin/layout.tsx`/`app/dashboard/layout.tsx`/`app/test/layout.tsx`) *in addition to* `app/robots.ts`'s `Disallow` rules — the two serve different purposes (disallow asks crawlers not to fetch the path at all; `noindex` guarantees a page that does get crawled anyway still won't appear in results) and neither alone is sufficient. When adding a new top-level route group, decide which category it belongs to before shipping it, and add the matching layout metadata if it's auth-gated. JSON-LD and canonical URLs are set at the most specific level that's actually correct (page-level for `app/page.tsx`'s canonical, not the root layout — see that file's own comment for why a root-level default would have been actively wrong for other pages) rather than a blanket default that happens to work for one page.

`app/opengraph-image.tsx` generates the share-preview image at request time via `next/og` rather than referencing a static file — there is no static brand image asset anywhere in this repo (`public/` is empty). If a real designed OG image is ever created, replace this file's contents with a static image import; Next.js's file-convention detection works the same either way.

## Deployment & startup validation

`next.config.js`'s `output: "standalone"` produces a self-contained `.next/standalone/server.js` — this is what `Dockerfile`'s final stage runs (`node server.js`, not `next start`, which explicitly warns it's incompatible with standalone output). `lib/env.ts` + `instrumentation.ts` validate the genuinely-required env vars (`DATABASE_URL`/`DIRECT_URL`/Clerk keys) once at process startup and **call `process.exit(1)` on failure** — a thrown error alone is not enough here, since Next.js logs an instrumentation-hook error but does not treat it as fatal by default (verified directly: without the explicit exit, a misconfigured server logged the error and then reported "Ready" anyway). Anything that already has its own fail-safe behavior (Sentry, Resend, Upstash — all no-op/fail-open without credentials, by design) is deliberately excluded from this required-var list; don't add them without also reconsidering whether that fail-safe behavior should change. Full deployment/backup/DR detail lives in `DEPLOYMENT.md`, not duplicated here.

## Optimistic UI + confirmation pattern

`components/admin/UserRoleCell.tsx` is the reference implementation for "propose → confirm → optimistically apply → roll back on failure": a `<select>` change opens `components/ui/ConfirmDialog.tsx` (native `<dialog>`) holding a *pending* value without touching the committed state; only on confirm does the component set its optimistic state and fire the request, reverting to the previous value if the server rejects it. Follow this shape for future admin mutations that want instant feedback rather than a full page reload — don't touch committed UI state until the user has actually confirmed the action.

## Data model

See `prisma/schema.prisma` directly — it's well-commented. Summary hierarchy: `Test → Module → (Passage | AudioTrack) → QuestionGroup → Question`, with `WritingTask`/`SpeakingPart` as module-type-specific children, and `TestAttempt → ModuleAttempt → (QuestionResponse | WritingResponse | SpeakingResponse)` mirroring it on the attempt side.

**Schema changes are gated.** The connected database is production infrastructure, not a dev sandbox — `schema.prisma` always matches what's actually been migrated in; nothing is added to it speculatively. A proposed field/index/model that hasn't been approved and applied lives in `DATABASE_MIGRATION_PLAN.md`, not in `schema.prisma`. See that file for currently-proposed (unapplied) analytics indexes.
