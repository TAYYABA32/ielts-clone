# Performance Report — IELTS Clone

**Date:** 2026-08-05
**Scope:** Full-application performance audit — Server Components, client bundle size, code splitting, image/font loading, database queries, caching, Suspense/streaming, React rendering, memoization, pagination. Verified fixes via `tsc`/`eslint`/`vitest`/`next build` and, for the two highest-stakes changes, direct inspection of the actual build output route table.

## Summary

Three concrete fixes shipped, each addressing a real, verified problem rather than a speculative one:

1. **`TestEngine.tsx` re-rendered its entire question sheet on every keystroke and every second** — a genuine defect in the highest-stakes UI in the app, now fixed at the root cause plus defense-in-depth memoization.
2. **`/admin/attempts` had no pagination** (hard-capped at 50 rows, silently hiding anything past that) — now matches the pagination pattern already used by `/admin/tests` and `/admin/users`.
3. **The marketing homepage blocked its entire render on a DB-backed auth check** needed only by the navbar — now streams via Suspense so static content isn't gated on it.

Everything else in this report is either a substantiated "already good, no action needed" finding, or a documented recommendation with the reasoning for not doing it now.

---

## Fixed

### 1. `TestEngine.tsx` — unnecessary re-renders on every keystroke and every timer tick

**Found:** `TestEngine` reactively subscribed to `answers`, `flagged`, `timeSpentPerQuestion`, and `remainingSeconds` from the Zustand test store at its top level — but none of these were ever read in `TestEngine`'s own JSX. They were only used inside `handleSubmit`'s closure, built that way so the closure would capture fresh values. The actual effect: **any change to any one answer, anywhere in the module, re-rendered the entire component tree** — including `QuestionSheetPane` (every question, every group) and the passage/audio panes — and the countdown timer's once-per-second tick did the same, all day, for the whole duration of every timed module.

**Fixed two ways:**
- **Root cause:** `handleSubmit` now reads `useTestStore.getState()` directly at call-time instead of subscribing reactively. This is exactly as correct for "the values at the moment of submission" (arguably more so — no closure staleness to reason about) and removes the subscriptions from `TestEngine` entirely. `handleSubmit`'s own dependency array shrank from 10 entries (most of which changed on nearly every user action) to 6 stable ones.
- **Defense-in-depth:** `ReadingPassagePane`, `ListeningAudioPane`, and `QuestionSheetPane` are now wrapped in `React.memo`. Their only prop (`module`) is set once at mount and never changes, so this guarantees they skip re-rendering even if `TestEngine` re-renders for an unrelated reason (e.g. `isSubmitting`/`showConfirm` local state) in the future.

**Why this matters more than a typical perf nit:** this is the timed exam-taking screen. A student answering question 3 of 40 was, before this fix, causing React to re-reconcile all 40 questions' worth of DOM on every keystroke, continuously, for the entire module duration. Not something a build-size metric would ever surface — found by reading the component's actual subscription/render logic, not by profiling output.

**Verified:** `tsc`/`eslint`/`vitest` (120/120)/`next build` all clean. Not verified with a live React DevTools Profiler session (no browser available in this environment) — the fix is a well-established, mechanically verifiable React pattern (removing unused top-level subscriptions, memoizing referentially-stable-prop components), not a guess.

### 2. `/admin/attempts` — no pagination

**Found:** hard-coded `take: 50`, no `skip`, no page controls — silently hides every attempt past the 50 most recent with no way to see them, unlike `/admin/tests` and `/admin/users` which both already use the shared `parsePagination` helper.

**Fixed:** now uses `parsePagination` (same helper, same `?page=` convention, default page size 50 to match prior behavior on page 1) plus Prev/Next links, matching the two sibling admin pages exactly.

**Verified:** `tsc`/`eslint`/`vitest`/`next build` clean.

### 3. Marketing homepage — streamed, not blocked, on the navbar's auth check

**Found:** `app/page.tsx` was `async` and `await`ed `getCurrentUser()` (a DB round-trip through Clerk → Postgres) at the very top, before rendering *anything* — including the fully-static hero/steps/testimonials sections that have no data dependency at all. Every visitor, logged in or not, waited on that DB round-trip before seeing a single pixel.

**Fixed:** extracted the auth-dependent piece into `components/layout/NavbarAsync.tsx` (an async Server Component) and wrapped it in `<Suspense fallback={<Navbar user={null} />}>`. Next.js's streaming SSR (available without any experimental flag) flushes the static shell immediately and streams the navbar in once its data resolves, instead of holding the entire response hostage to one component's DB call.

**Trade-off, stated plainly:** an already-logged-in visitor may see the signed-out navbar for a moment before it swaps to their name/role link. Accepted deliberately: this is a marketing page where the overwhelming majority of visits are anonymous (logged-in users mostly land on `/dashboard`, not `/`), so optimizing the common case is the right call — and the visual difference between states is a single link swap, not a layout-shifting change (confirmed by reading `Navbar.tsx`).

**Verified:** `next build` shows the route unchanged in size (7.94 kB / 171 kB) and still correctly dynamic (`ƒ`) — this fix is a *streaming* improvement (time-to-first-byte / progressive render), which bundle-size and static/dynamic classification don't capture. Documented here rather than overclaimed with a metric that wouldn't show it.

---

## Investigated — no fix needed

- **Server Components ratio:** 34 of 66 `.tsx` files under `app/`/`components/` are `"use client"`. Spot-checked several (`HeroBanner` — genuine carousel with `useState`/click handlers; `SiteChrome` — needs `usePathname()`; `FooterDropdown`/`ScrollToTopButton` — genuine interactivity) — every one checked has a real interactivity requirement, not a default/habit. Given this codebase's existing convention (documented in `ARCHITECTURE.md`: "prefer Server Components; a component only becomes client when it needs interactivity") was already being followed correctly throughout this session's own additions, no systematic over-use of `"use client"` was found.
- **N+1 queries:** grepped for `await prisma` inside `.map()`/`for` loops across `app/` and `lib/` — none found. Every list/aggregate operation already uses `findMany`/`groupBy`/`Promise.all` correctly (this was true before this audit too — `lib/admin/analytics.ts` in particular already parallelizes its 9 queries via `Promise.all` rather than sequential `await`s).
- **Font loading:** no web font is loaded (`app/layout.tsx` has no `next/font` import) — system font stack via Tailwind's default. Already optimal for a test-taking product where layout stability and zero FOUT/FOIT risk matter more than brand typography; confirmed as a deliberate choice in `ARCHITECTURE.md` already. No action.
- **Code splitting for heavy client libs (Recharts):** already correctly isolated per-route by Next's automatic App Router code splitting — confirmed via the build output: `/admin/analytics` and `/dashboard/attempts/[attemptId]` (the only two Recharts-using routes) carry ~100 kB more First Load JS than routes that don't use it, and that cost does *not* appear on any other route. No manual `next/dynamic` needed; the automatic per-route splitting already achieves the same isolation.

---

## Documented, not fixed (with reasoning)

### Admin-uploaded images stay `<img>`, not `next/image`
`TestEngine.tsx` (map-labeling images) and `WritingEngine.tsx` (task charts/diagrams) render admin-uploaded, Supabase-Storage-hosted images via plain `<img>` with an existing `eslint-disable` for `@next/next/no-img-element`. Converting to `next/image` would need either stored width/height metadata (none exists in the schema — would need a `DATABASE_MIGRATION_PLAN.md` entry, out of scope for a performance pass) or a `fill`-based layout requiring careful CSS aspect-ratio work. Given these render inside the live, timed exam-taking UI and there is no live browser available in this environment to visually verify a layout change, the risk of a silent visual regression outweighs the optimization gain for these two specific images. Left as-is, decision documented rather than either blindly converted or silently ignored.

### `BandProgressChart` fetches client-side instead of streaming server-side
`components/dashboard/BandProgressChart.tsx` fetches `/api/users/:userId/band-history` via a client-side `useEffect`, with its own loading/error/empty states (already meets the "every screen needs loading/error states" bar). Converting this to a server-streamed component (following the same Suspense pattern used for the homepage navbar fix) would remove one client-server round trip and the loading flash. Not done now: this is a real but comparatively low-value improvement (already has good states, isn't broken), and the homepage fix already demonstrates the pattern concretely if this is prioritized later.

### `/admin/analytics` renders all 9 parallel queries before any content paints
Unlike the homepage, this page's `Promise.all` of 9 queries all resolve together before anything renders — no per-section streaming. Not fixed now: this is an admin-only, internal, lower-traffic page (versus the public marketing homepage, where every visitor pays the cost), so the same fix here has a smaller blast radius of benefit. A genuine follow-up if admin analytics usage grows.

### Sentry's client bundle cost (from M4.1)
Shared First Load JS grew from 87.5 kB to 161 kB and Middleware from 61.2 kB to 129 kB after adding Sentry. This cost is paid regardless of whether `NEXT_PUBLIC_SENTRY_DSN` is actually set — the SDK is a static import in `sentry.client.config.ts`, so it's bundled at build time either way, not conditionally at runtime. A more advanced fix (dynamically `import()`-ing the Sentry client SDK only when a DSN is present) is possible but wasn't attempted here — it would need testing against `withSentryConfig`'s webpack plugin, which expects the config file to always run, and verifying that live (which this environment can't do) before shipping. Documented as a known, accepted cost of the observability tooling, not an oversight.

### Experimental Partial Prerendering (PPR) not enabled
Would let the homepage's static shell be genuinely prerendered/cached while only the navbar's data is per-request, rather than the whole route staying dynamic with a streaming boundary inside it (today's fix). Not enabled: `experimental.ppr` carries real risk of subtle behavior differences across Next.js patch versions, and this environment has no way to live-verify it beyond a clean build. The streaming-without-PPR fix already shipped provides a real, safe win without that risk.

### Database indexes
Already tracked in full in `DATABASE_MIGRATION_PLAN.md` (6 proposals, all reviewed and deferred per the standing database-migration policy) — not duplicated here to avoid two documents drifting apart.

---

## Verification

Every fix in this report was verified via the full standard gate (`tsc`, `eslint`, `vitest` — 120/120, `next build`), plus for the two build-output-visible changes, direct inspection of the build's route table (before/after route sizes and static/dynamic classification) rather than trusting the change blind.
