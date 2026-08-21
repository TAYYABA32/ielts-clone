# Security Audit — IELTS Clone

**Date:** 2026-08-04
**Scope:** Full application — every API route, auth/session code, file storage, rate limiting, client-rendered content, configuration files, and environment/secrets handling. Performed by re-reading current source directly (not relying on prior analysis from memory), cross-checked against `PROJECT_ANALYSIS.md`'s earlier findings where they overlap.

## Executive summary

**No new Critical-severity issues were found.** The two Critical issues previously identified (auth bypass on Listening/Reading submission; the answer key leaking to the browser pre-submission) were re-verified as fixed and remain fixed. One **High** severity gap was found (missing request-body validation on one route) — since resolved (see below). One trivial, mechanical gap (a single route missing rate limiting, inconsistent with the other 12) was fixed immediately as routine hygiene since it's a one-line, zero-design-risk correction of my own earlier oversight, not a scheduled remediation.

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | — |
| High | 1 | ✅ Fixed |
| Medium | 7 | 4 fixed (M1, M4, M5, M7), 3 open (M2, M3, M6 — need verification/business judgment, not pure engineering) |
| Low | 6 | 1 fixed (L1), 5 open/informational |
| Fixed total | 7 | `band-history` rate-limited; `submit` Zod-validated (H1); security headers + Report-Only CSP (M1); essay length cap (M4); `.gitignore` env coverage (M5); upload content-sniffing (M7); `X-Powered-By` disabled (L1) |

**All High and Critical severity findings are resolved. 4 of 7 Medium findings are resolved** (the remaining 3 — CSRF cookie verification, speaking-recording URL exposure, and the CONTENT_EDITOR module-deletion inconsistency — need live verification or a product-policy call, not a pure engineering fix, so they were intentionally left for the user's own prioritization per the "non-business-decision findings only" scope of this pass).

---

## Findings by severity

### High

#### ✅ H1 — `submit` route accepts an unvalidated request body (fixed)
**File:** `app/api/test-attempts/[attemptId]/submit/route.ts:35`
```ts
const body = (await request.json()) as SubmitRequestBody;
```
This is a TypeScript **type assertion**, not runtime validation — every sibling mutating route (`writing-submit`, `progress`, `admin/tests`, etc.) parses its body through a Zod schema; this one doesn't. Concretely reachable problems:
- `body.totalTimeSpentSeconds` is written directly to `ModuleAttempt.timeSpentSeconds` (a Postgres `Int`) with no bounds check — a negative number, a float, or an out-of-range value corrupts a stored statistic with no validation error, whereas every other numeric input in the app is Zod-bounded (`z.number().int().min(0)`-style).
- A malformed `body.answers`/`body.flagged`/`body.moduleId` (wrong type, `null`, missing) is likely to throw a generic `TypeError` deep inside `gradeModule`/Prisma, which the route's `catch` block does turn into a clean 500 rather than crashing the process — so this is **not** a crash/injection risk, but it is an availability/data-integrity gap and an inconsistency with the rest of the codebase's input-validation discipline.
- No injection risk: Prisma parameterizes all queries regardless of input shape.

**Fix applied:** `submit/route.ts` now parses its body through `submitRequestSchema` (Zod), placed immediately after `requireUser()` and before any Prisma lookup or grading — matching the established rate-limit → auth → validate → business-logic ordering used by every sibling route. Validates:
- **Required fields:** `moduleId`, `answers`, `flagged`, `timeSpentPerQuestion`, `totalTimeSpentSeconds` all required (Zod's default — no `.optional()`).
- **Numeric ranges:** `totalTimeSpentSeconds` and every value in `timeSpentPerQuestion` are `z.number().int().min(0).max(86_400)` — rejects negative, fractional, non-numeric, and absurdly large values that previously wrote straight to the DB unchecked.
- **String lengths:** each answer value capped at 500 characters (covers every legitimate question-type answer with headroom).
- **Arrays:** multi-select answers capped at 20 entries, each entry itself length-checked.
- **Nested objects:** `answers`/`flagged`/`timeSpentPerQuestion` are `z.record(...)` of validated value schemas, so every entry in every map is checked, not just the top-level shape.

A malformed request now gets the same `422 { error: "Validation failed", issues: [...] }` shape every other route already returns (handled centrally by `handleApiError`'s existing `ZodError` branch — no new error-handling code needed). Re-verified: `tsc`, `eslint`, `vitest` (104/104), `next build` all pass.

---

### Medium

#### ✅ M1 — No Content-Security-Policy or other security headers (fixed — CSP shipped Report-Only)
**File:** `next.config.js` now has a `headers()` block: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` (self, not blocked — the Speaking module records audio on this app's own origin), `Strict-Transport-Security: max-age=15552000; includeSubDomains`, and a CSP scoped to Clerk/Supabase/Upstash/Unsplash domains.
**Deliberately shipped as `Content-Security-Policy-Report-Only`, not enforcing.** This environment can't live-browser-test against the actual deployed Clerk frontend-API domain, and an incorrectly *enforcing* CSP risks silently breaking authentication for the whole app — worse than no CSP yet. Report-Only lets the policy be observed via browser devtools without blocking anything. **Follow-up before enforcing:** verify zero violations in real usage, then rename the header to `Content-Security-Policy`. Known, documented gap: `'unsafe-inline'` on `script-src` — removing it needs a nonce threaded through Next's app-router rendering, a real follow-up not attempted blind here.

#### M2 — CSRF protection for API Route Handlers relies entirely on an unverified third-party default
Every mutating endpoint (`submit`, `writing-submit`, `admin/*` POST/PATCH/DELETE, etc.) is a plain `app/api/**/route.ts` Route Handler, authenticated via Clerk's session cookie read server-side through `auth()`. **Next.js's built-in CSRF protection (Origin-header verification) only applies to Server Actions** (`"use server"` functions like `createTest`/`startOrResumeAttempt`), not to Route Handlers — so these routes have no CSRF defense of their own. The only protection is whatever `SameSite` attribute Clerk sets on its session cookie (documented default: `Lax`), which — if correct — blocks the cookie from being attached to a cross-site POST/PUT/DELETE/fetch, providing real protection. This app never configures cookies itself, so this is entirely inherited, unverified behavior.
**Recommendation:** confirm Clerk's actual cookie `SameSite`/`Secure` attributes for this project (via browser devtools against a running instance, not just documentation), and consider it a hard requirement before launch — not just an assumption. If a same-site relaxation is ever needed (e.g., multi-subdomain SSO), CSRF tokens would need to be added explicitly at that point.

#### M3 — Speaking recordings are stored in a (likely) public bucket with permanent URLs
**File:** `lib/storage/saveUploadedFile.ts`, via `supabase.storage.from(bucket).getPublicUrl(...)`.
Candidate speaking recordings (voice, potentially identifiable) get the same "public bucket + unguessable random UUID filename" protection model as admin-authored content (audio tracks, images) — reasonable for CMS content, less so for a candidate's own recorded voice. There's no expiry and no auth check on the fetch itself; anyone who obtains the URL (browser history, a referrer leak, a shared screenshot, log aggregation, etc.) can play the recording indefinitely, with no server-side ability to revoke access.
**Recommendation:** for `speaking-upload` specifically, consider Supabase Storage's `createSignedUrl()` (short-lived, revocable) instead of `getPublicUrl()`, or keep the bucket private and proxy playback through an authenticated route. Lower priority for admin-uploaded content (test audio/images), which is meant to be broadly servable anyway.

#### ✅ M4 — No max length on Writing-task essay submissions (fixed)
**File:** `app/api/test-attempts/[attemptId]/writing-submit/route.ts` — `responses: z.record(z.string().max(20_000))`. 20,000 chars is a generous ceiling relative to any legitimate IELTS essay (a few hundred words), closing the unbounded-input gap without risking a false rejection of a real submission.

#### ✅ M5 — `.gitignore` doesn't cover all Next.js env-file naming conventions (fixed)
**File:** `.gitignore` — now `.env*` with `!.env.example` negation, covering every `.env.*` variant (including non-`.local` ones like `.env.production`) rather than just `.env`/`.env*.local`, while keeping the checked-in template tracked.

#### M6 — Inconsistent destructive-action authorization between Test and Module deletion
**Files:** `app/api/admin/tests/[testId]/route.ts` (`DELETE` → `requireRole("ADMIN")` only) vs. `app/api/admin/tests/[testId]/modules/[moduleId]/route.ts` (`DELETE` → `requireAdmin()`, which also allows `CONTENT_EDITOR`).
Deleting an entire `Test` is deliberately restricted to full `ADMIN` (per that route's own comment: *"content editors can edit but not permanently delete a published test"*) — but deleting one of that test's `Module`s (which cascades to all its passages/audio/questions) is allowed for `CONTENT_EDITOR` too. This looks like an oversight rather than an intentional policy: a `CONTENT_EDITOR` can already achieve near-total content destruction one module at a time, just not in a single `DELETE /tests/:id` call.
**Recommendation:** either restrict module deletion to `ADMIN` as well, or document why module-level deletion is intentionally less restricted than test-level deletion.

#### ✅ M7 — Upload MIME-type validation trusts the client-supplied `Content-Type` (fixed)
`lib/storage/fileSignature.ts` (new) checks the uploaded file's actual bytes against known magic-byte signatures for its claimed category (image: JPEG/PNG/GIF/WEBP; audio: MP3/WAV/WebM/MP4/OGG) before it's stored — a spoofed `Content-Type` header with unrelated bytes behind it is now rejected (`415`). Checks at the category level (image vs audio), matching how the existing MIME-prefix check already works, not the exact sub-format — proportionate to the actual threat (arbitrary bytes disguised as a media file), not a full format-validity parser. 16 unit tests (`fileSignature.test.ts`) cover every signature plus negative cases.

---

### Low

#### ✅ L1 — `X-Powered-By: Next.js` header not disabled (fixed)
`poweredByHeader: false` set in `next.config.js`.

#### L2 — No explicit CORS configuration
Not a vulnerability — the *absence* of CORS headers means the browser's default same-origin policy applies, which is the correct, secure posture for a first-party API that isn't meant to be called cross-origin. Noted here only so it's clear this was checked, not overlooked.

#### L3 — Admin/content-editor–authored `audioUrl`/`imageUrl` fields accept any URL scheme
`z.string().url()` in `testSchemas.ts` doesn't restrict to `https:` — a `javascript:`/`data:` URI would technically pass validation. Exploitability is low in the current rendering contexts (`<audio src>`, `<img src>` don't execute `javascript:` URIs in modern browsers), and the authors of this content are semi-trusted internal roles (Admin/Content Editor), not arbitrary end users. Cheap defense-in-depth: restrict the schema to `z.string().url().refine(u => u.startsWith("https://"))`.

#### L4 — No automated audit log for privileged actions
Already tracked as Finding 4 in `PROJECT_ANALYSIS.md` / roadmap item M2.4 (the milestone this audit precedes) — re-confirmed still open, not re-detailed here to avoid duplication.

#### L5 — Rate limiting fails open on Upstash unavailability (by design, worth restating)
Documented and deliberate (see `PRODUCT_ROADMAP.md` M2.3) — an Upstash outage or misconfiguration means requests are allowed through rather than blocked, for the whole window the backend is unreachable. Correct trade-off for availability, but means rate limiting is not a *guaranteed* control during an infra incident. No action needed beyond awareness; restated here because a security audit checklist item ("rate limiting") shouldn't silently omit this nuance.

#### L6 — Zod validation error details are returned to the client
`handleApiError.ts` returns `error.issues` (field paths + messages) on a `422`. This is normal, helpful API behavior for legitimate consumers, not a vulnerability — but it does reveal internal field/schema names to a probing attacker. Acceptable as-is; noted for completeness since "API responses" was an explicit review category.

---

## Category-by-category notes (for anything not already covered by a numbered finding above)

- **Authentication:** Clerk (`@clerk/nextjs`) handles credentials, MFA, and session issuance entirely; no custom auth code exists to audit beyond session→role resolution (`lib/auth/session.ts`), which was reviewed and is sound (unique-constraint race handled correctly on JIT user creation). Recommend enabling Clerk's built-in bot-detection/MFA features via the Clerk dashboard — operational, not a code change.
- **Authorization:** `requireUser`/`requireRole`/`requireAdmin` pattern is applied consistently across all 15 API routes; ownership checks (`attempt.userId === user.id`) are present everywhere a request acts on a specific resource. See M6 above for the one inconsistency found.
- **Rate limiting:** 12 of 13 relevant routes covered as of M2.3; the 13th (`band-history`) was found missing during this audit and fixed immediately (see below) since it's a one-line, zero-ambiguity correction of an oversight in that milestone, not a new design decision.
- **File uploads:** see M3, M7.
- **Input validation:** H1 fixed (see above); M4 still open. Every route now correctly validates via Zod.
- **XSS:** no `dangerouslySetInnerHTML` anywhere in the codebase; all user-authored content (essays, test titles, passages, examiner notes) renders through JSX's default escaping. No reflected/stored XSS vector found.
- **CSRF:** see M2.
- **SQL injection:** no raw queries (`$queryRaw`/`$executeRaw`/`*Unsafe` variants) anywhere; 100% Prisma query builder, which parameterizes by construction. No risk found.
- **Session handling:** delegated to Clerk; JIT local-user provisioning reviewed and race-safe.
- **Cookies:** entirely Clerk-managed; this app sets no cookies of its own. See M2 for the one open question (verify actual `SameSite` value).
- **Environment variables / secrets:** no secret is ever `NEXT_PUBLIC_`-prefixed or passed to a client component; `grep` for hardcoded key patterns (`sk_live`, `AKIA`, private-key headers, etc.) found nothing in source. See M5 for the `.gitignore` gap.
- **API responses / error handling:** `handleApiError.ts` correctly avoids leaking stack traces or internal error detail for generic errors (logs server-side, returns a generic message); see M4/L6 for the two narrower notes.
- **CORS:** see L2.
- **Content Security Policy:** see M1.

---

## Fixed during / immediately after this audit

- **`app/api/users/[userId]/band-history/route.ts`** was the only one of 13 relevant routes not covered by M2.3's rate limiting — added `enforceRateLimit(request, RATE_LIMIT_TIERS.admin)` (the tier its usage pattern most resembles: authenticated, moderate frequency), matching the exact pattern already used everywhere else.
- **H1** — `submit/route.ts` now validates its request body via `submitRequestSchema` (Zod), matching every sibling route's pattern. See the H1 entry above for full detail.

Both fixes verified via `tsc`/`eslint`/`vitest` (104/104)/`next build`. See `CHANGELOG.md`.

## No outstanding Critical or High issues

Both Critical issues ever identified in this project (`PROJECT_ANALYSIS.md` Findings 1 and 2 — the submit-route auth bypass and the pre-submission answer-key leak) were re-verified in this audit as still fixed. The one High finding (H1) is now fixed. No new Critical was found. The roadmap (starting with M2.4) can proceed; the Medium findings above should be scheduled as their own milestones.
