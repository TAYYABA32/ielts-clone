# IELTS Clone

A web app for taking full-length IELTS mock tests (Listening, Reading, Writing, Speaking) online, with auto-grading for objective sections, examiner grading for subjective ones, and a student dashboard to track band score progress over time.

Built with Next.js 14 (App Router), Prisma + PostgreSQL, Clerk for auth, Zustand for client state, and Tailwind for styling.

---

## What this project is

A clone of an IELTS test-prep platform (marketing landing page + real test-taking engine + admin CMS), not just a UI mockup. The data model, scoring logic, and auth/roles are all real and working end-to-end for the core flow.

Three user roles: `STUDENT`, `CONTENT_EDITOR`, `ADMIN` (see `prisma/schema.prisma`). Editors/admins build tests in a CMS; students take them and see results on a dashboard.

## What's built and working

**Marketing landing page** (`app/page.tsx`) — hero, "6 steps" section, mock test banner, testimonials, footer, etc. Static marketing components, not test logic.

**Auth** — Clerk handles sign-up/login/session (`app/login`, `app/signup`, `app/sso-callback`). A local `User` row (with `role`) is created just-in-time on first authenticated request (`lib/auth/session.ts`) rather than via webhook. Route protection is in `middleware.ts` (redirects unauthenticated visitors off `/admin`, `/dashboard`, `/test`); role enforcement (admin vs student) happens per-request in `requireAdmin()`/`requireRole()` since Edge middleware can't hit Postgres.

**Test bank data model** — a `Test` has 4 `Module`s (Listening/Reading/Writing/Speaking), each with passages/audio tracks/question groups/writing tasks/speaking parts. 5 question types supported: multiple choice, true/false/not given, matching headings, sentence completion, map labeling. Question-type-specific shape is JSON, validated on write via Zod (`lib/validation/testSchemas.ts`) and against a parallel JSON Schema (`schemas/ielts-test.schema.json`).

**Admin CMS** (`app/admin`, `components/admin`) — `TestBuilderForm`, `ModuleEditor`, `QuestionGroupEditor`, file upload for audio/images (`app/api/admin/upload`, `lib/storage/saveUploadedFile.ts`), and an `ExaminerScoreForm` for manually scoring Writing/Speaking submissions plus a list of attempts to grade (`app/admin/attempts`).

**Test-taking engine** (`components/test-engine`) — `TestEngine` (Listening/Reading, with `QuestionRenderer` per question type, `QuestionNavigator`, flagging, split-screen passage/questions view via `ResizableSplitScreen`), `WritingEngine` (word count, per-task timer), `SpeakingEngine`/`SpeakingPartRunner` (prep time, recording via `AudioRecorder`, upload). `CountdownTimer` + `useCountdown` drive per-module time limits. Candidate module order is fixed: Listening → Reading → Writing → Speaking (`lib/testSequence.ts`).

**Autosave & resume** — in-progress answers, flags, and remaining time are periodically snapshotted to `SavedProgress` (`lib/hooks/useAutosaveProgress.ts`, `app/api/test-attempts/[attemptId]/progress`), so closing the tab mid-test doesn't lose work. `start/actions.ts` resumes an `IN_PROGRESS` attempt or creates a new one.

**Scoring** — Listening/Reading are auto-graded (`lib/scoring/gradeModule.ts`) by comparing submitted JSON answers against the embedded answer key, then mapped raw-score → band via a lookup table (`lib/scoring/bandScoreTables.ts`, seeded per test type + module in `BandScoreConversion`). Writing/Speaking are always examiner-graded (never auto-scored) via the admin CMS. `recomputeOverallBand.ts` recomputes the attempt's overall band (mean of available module bands, rounded to nearest 0.5) whenever either grading path lands — since either can finish last.

**Student dashboard** (`app/dashboard/attempts/[attemptId]`) — per-attempt breakdown by module (`AttemptBreakdown`) and a band-score-over-time chart (`BandProgressChart`, via Recharts) fed by `app/api/users/[userId]/band-history`.

**API routes** — REST-ish routes under `app/api` for admin test/module CRUD, file upload, attempt progress/submit, writing submit, speaking upload, and band history. No GraphQL/tRPC — plain Next.js route handlers + Zod validation.

## What's incomplete / missing

- **No "browse tests" page for students.** There's no UI list linking to `/test/[testId]/start` — a student needs the direct URL/ID to start a test. Same gap on the admin side: no `/admin/tests` index page, only `/admin/tests/[testId]` for editing a specific one (no visible "create new test" entry point in the UI either, unless it's driven purely via the API).
- **No `/dashboard` landing page** — only `/dashboard/attempts/[attemptId]` exists. There's no page listing a student's own past attempts to link into that.
- **Speaking module is asynchronous, not live/proctored** — it's record-and-upload (`AudioRecorder` → `speaking-upload`), not a real-time interview simulation, and there's no video/webcam proctoring anywhere.
- **Writing/Speaking scoring is 100% manual** — no AI/LLM-based band estimation for essays or speech; an examiner must open the CMS and score every submission by hand. If you want faster feedback loops this is the biggest lever.
- **No payments/subscriptions** — despite the marketing landing page implying a commercial product, there's no billing, plans, or paywall anywhere in the code.
- **No notifications/emails** (e.g. "your test has been graded").
- **No admin analytics** (cohort pass rates, question-level difficulty stats, etc.) beyond the individual student's own band chart.
- **No automated tests** — no `__tests__`/`*.test.ts` files or test runner configured in `package.json`. Grading logic, autosave, and band math are all currently unverified by anything but manual testing.
- **No CI config** (no `.github/workflows`, etc).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, Server Components + Server Actions) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Clerk (`@clerk/nextjs`) |
| Client state | Zustand (`lib/store/testStore.ts`) |
| Forms/validation | react-hook-form + Zod |
| Charts | Recharts |
| Styling | Tailwind CSS |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Clerk keys + Postgres URLs
npx prisma migrate dev
npm run dev
```

`.env.local` needs:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL` — pooled connection (PgBouncer transaction mode, port 6543) for the running app
- `DIRECT_URL` — direct/session-mode connection (port 5432), needed by `prisma migrate` since transaction-mode pooling doesn't support what Migrate relies on
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` — file uploads (Supabase Storage, same project as the database); create the bucket in the Supabase dashboard before first use. See `.env.example` for details.

## Project structure

```
app/                  Routes (App Router): admin CMS, dashboard, test-taking flow, API routes
components/
  admin/              Test/module/question builder forms
  test-engine/        Listening/Reading/Writing/Speaking runtime UI
  dashboard/          Attempt breakdown + band progress chart
  layout/             Marketing landing page sections
lib/
  auth/               Clerk session -> local User, role checks
  scoring/            Auto-grading + band conversion + overall band recompute
  validation/         Zod schemas for test-builder input
  store/              Zustand test-taking state
  storage/            File upload handling
prisma/schema.prisma  Full data model (users, tests, modules, attempts, responses)
schemas/              Standalone JSON Schema mirror of the test structure
```

## Ideas for what to build next

Rough priority order if picking this back up:
1. Add the missing navigation pages (student "my tests"/"my attempts" list, admin test index + create-test button) — right now the core loop only works if you already know the test/attempt IDs.
2. Decide on and wire up cloud file storage before deploying anywhere without persistent disk.
3. Add automated tests around `gradeModule.ts` / `recomputeOverallBand.ts` / `testSchemas.ts` — this is the logic most worth protecting from regressions.
4. Consider LLM-assisted (not fully automated) scoring for Writing to speed up examiner turnaround.
5. Payments, if this is meant to be a real product rather than a portfolio/learning project.
