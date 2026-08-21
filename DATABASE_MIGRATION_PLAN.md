# Database Migration Plan

Proposed schema changes awaiting review. **Nothing in this document has been applied.** `prisma/schema.prisma` currently matches the live database exactly (verified via `prisma migrate status` — "Database schema is up to date," 2 migrations applied: `init`, `add_audit_log`). Per standing instruction, no further `prisma migrate dev`/`db push` runs against the live Supabase database until explicitly approved, one migration at a time or as a reviewed batch.

How to use this doc: each proposal below is self-contained (change, why, benefit, risk, additive/breaking). Approve individually or as a batch; once approved I'll apply via `prisma migrate dev --name <name>` and update this file to mark it done (mirroring how `PRODUCT_ROADMAP.md` tracks milestones).

---

## Proposal 1 — Index `TestAttempt.startedAt`

```prisma
model TestAttempt {
  // ...unchanged fields...
  @@index([userId])
  @@index([testId])
  @@index([startedAt])   // NEW
}
```

- **Why:** M3.2 (Admin Analytics) filters `TestAttempt` by `startedAt` for every date-ranged metric — new test attempts in range, active-user lookups (distinct `userId` where `startedAt` in range), and the registration/attempt-count stat tiles. None of the existing indexes (`userId`, `testId`) help this filter.
- **Expected benefit:** without this index, a date-range filter on `startedAt` is a sequential scan of the whole `TestAttempt` table. Negligible at current data volume (a handful of test attempts); becomes meaningful once the table reaches thousands–tens of thousands of rows, at which point this turns an O(n) scan into an O(log n) index range scan for every analytics page load.
- **Risk:** none to existing data or queries — purely additive, no column/type changes. Write-path cost: every `TestAttempt` insert/update pays a small index-maintenance cost (already true for the two existing indexes; one more index is the same category of cost, not a new category).
- **Additive or breaking:** additive. Safe to apply independently of the others below.

## Proposal 2 — Composite index `TestAttempt (status, submittedAt)`

```prisma
model TestAttempt {
  // ...
  @@index([status, submittedAt])   // NEW
}
```

- **Why:** the completion-rate, average-band-score, and pass-rate-trend queries all filter `WHERE status = 'SUBMITTED' AND submittedAt BETWEEN ...`. A composite index with `status` first lets Postgres narrow to submitted attempts, then range-scan `submittedAt` within that — the shape that matches these queries' exact filter pattern, which a single-column index on either field alone wouldn't serve as well (e.g. an index on `submittedAt` alone still has to filter out non-`SUBMITTED` rows after the range scan).
- **Expected benefit:** same category as Proposal 1 — negligible today, meaningfully faster (index range scan vs. sequential scan + filter) once attempt volume grows. This is the query that runs most often on the analytics page (completion rate, avg band, pass rate all depend on it).
- **Risk:** additive only. Slightly more index-maintenance overhead per write than Proposal 1 alone (composite indexes are marginally more expensive to maintain than single-column ones), still negligible at this app's write volume (test submissions are human-paced, not high-frequency).
- **Additive or breaking:** additive.

## Proposal 3 — Index `QuestionResponse.answeredAt`

```prisma
model QuestionResponse {
  // ...
  @@index([answeredAt])   // NEW
}
```

- **Why:** the "hardest questions" (question-difficulty) analytics query groups `QuestionResponse` by `questionId` filtered to `answeredAt BETWEEN <range>` (to scope difficulty stats to the selected date range rather than all-time). Existing indexes (`moduleAttemptId`, `questionId`) don't help a date-range filter applied before the group-by.
- **Expected benefit:** same category as above — this table grows with every question answered by every candidate, so it's the one most likely to reach real volume soonest of the three proposals. Indexing `answeredAt` keeps the date-filtered aggregation fast as that happens.
- **Risk:** additive only, same write-cost caveat as Proposal 1.
- **Additive or breaking:** additive.

## Proposal 4 — Index `User.createdAt`

```prisma
model User {
  // ...
  @@index([clerkId])
  @@index([createdAt])   // NEW
}
```

- **Why:** the registration-trend chart and "new registrations" stat tile filter `User` by `createdAt` within the selected range. `User` is a low-write-volume table (one insert per person, ever), so this is the lowest-urgency of the four proposals, but it's the same fix for the same class of problem.
- **Expected benefit:** smallest of the four in absolute terms (this table will always be orders of magnitude smaller than `TestAttempt`/`QuestionResponse`), but still the correct fix for the query shape, and cheap to add alongside the others.
- **Risk:** additive only, negligible write-cost impact (`User` rows are created once per person, not per action).
- **Additive or breaking:** additive.

## Proposal 5 — `Notification` model (M3.3: in-app notifications)

```prisma
enum NotificationType {
  MODULE_GRADED
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String           @db.Text
  metadata  Json?
  readAt    DateTime?
  createdAt DateTime         @default(now())

  @@index([userId, readAt])
  @@index([createdAt])
}
```

- **Why:** M3.3 requires in-app notifications with read/unread state — this needs a real table; there's no way to persist "has this user seen this notification" without one. The email side of M3.3 (Resend integration, `lib/email/*`) is already built and doesn't depend on this — this proposal is specifically the *in-app* half.
- **Design note — deliberately DOES cascade-delete with `User`, unlike `AuditLog`.** `AuditLog` intentionally has no FK to `User` (audit history must survive account deletion for compliance/investigation — see `ARCHITECTURE.md`). A `Notification` is the opposite case: it's personal to the account, has no standalone value once the account is gone, and keeping it around post-deletion would be a straight-up data-retention liability with no offsetting benefit. `onDelete: Cascade` is the correct choice here specifically because it's *not* an audit record.
- **`@@index([userId, readAt])`:** serves the two real query shapes — "this user's unread notifications" (`WHERE userId = ? AND readAt IS NULL`) and "this user's notification history" (`WHERE userId = ?`, `readAt` ignored) — both satisfied by one composite index with `userId` first.
- **Expected benefit:** correctness, not just performance — this table is the only way the in-app notification feature can exist at all, not an optimization of something that already works.
- **Risk:** additive (new table, new enum) — zero impact on any existing table/query. `onDelete: Cascade` means deleting a `User` row will delete their notifications too; this is the intended, safe behavior described above, not a risk.
- **Additive or breaking:** additive.

## Proposal 6 — `User.emailOnGraded` preference field (M3.3: notification preferences)

```prisma
model User {
  // ...existing fields...
  emailOnGraded Boolean @default(true)   // NEW
}
```

- **Why:** M3.3 requires notification preferences. A single boolean matches the one notification type currently implemented (grading complete); default `true` preserves today's behavior (everyone gets the email) for existing rows — nobody's experience changes silently when this lands.
- **Expected benefit:** lets a candidate opt out of grading emails without code changes once a preferences UI exists.
- **Risk:** additive column with a default — existing rows get `true` automatically, no backfill script needed, no query behavior changes until the grading route is updated to check this field (a follow-up code change, included in the same PR as this migration when approved, not a separate step).
- **Additive or breaking:** additive.
- **Note:** if more notification types are added later (beyond grading), consider whether per-type boolean columns (`emailOnGraded`, `emailOnX`, ...) stay proportionate or whether a small `NotificationPreference` join table becomes worth it — not a decision needed now, just flagging the fork in the road for whoever adds the second notification type.

---

## Recommended batching

Proposals 1-4 are additive (`CREATE INDEX` only — no column changes, no data migration, no risk of data loss), independent of each other, and safe to apply in a single migration if approved together. Suggested migration name: `add_analytics_indexes`.

Proposals 5-6 (`Notification` model + `User.emailOnGraded`) are a separate, independent migration — new table/enum/column, no relationship to 1-4. Suggested migration name: `add_notifications`. Safe to approve separately from (or together with) 1-4; they don't depend on each other.

## Current status without these migrations

- **M3.2 (analytics):** implemented against the **current, unmodified schema** — every analytics query in `lib/admin/analytics.ts` works correctly today; the only effect of not having Proposals 1-4 yet is more sequential-scan work per query than an index would give. Imperceptible at current data volume; worth having before real production traffic accumulates. Nothing about M3.2's functionality is blocked.
- **M3.3 (notifications):** the **email side is fully built and functional** without any schema change (`lib/email/*`, wired into examiner grading) — this is genuinely done. The **in-app half (persisted notifications, read/unread state, preferences UI) cannot exist without Proposals 5-6** — there's no way to persist "has this user seen this" without a table for it. This is the one part of M3.3 actually blocked pending approval, not a performance-only concern like 1-4.
