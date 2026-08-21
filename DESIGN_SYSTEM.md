# Design System — IELTS Clone

Documentation-only, not yet implemented (per Session 3 mandate — implementation happens incrementally as P1+ UI milestones from `PRODUCT_ROADMAP.md` are built, not as a big-bang restyle). Extends the existing Tailwind setup (`tailwind.config.js`, `app/globals.css`) rather than replacing it — the current `brand` color scale and base-tag styling stay; this document adds the tokens and rules missing today.

Inspiration: Stripe, Linear, Vercel, Notion, Apple, Framer, Clerk, Supabase, GitHub, Material 3 — used as a *feel* reference (density, restraint, motion), never copied directly.

---

## 1. Design Tokens

### Color

Keep the existing `brand` scale (`tailwind.config.js`) as the single accent color — it's already a clean indigo scale, no reason to introduce a second brand hue. Add semantic tokens on top of Tailwind's default gray/red/green/amber scales rather than inventing new hex values:

| Token | Light | Usage |
|---|---|---|
| `brand-*` | existing scale | primary actions, links, focus rings — unchanged |
| `success` (green-600/green-50) | — | correct answers, submitted status, band improvement |
| `warning` (amber-600/amber-50) | — | flagged questions, time running low, pending examiner review |
| `danger` (red-600/red-50) | — | destructive actions, errors, expired attempts |
| `neutral` (gray-*, existing default) | — | body text, borders, backgrounds |

**Rule:** no raw hex codes in components. Every color reference goes through a Tailwind class backed by one of these scales. This is already mostly true (`brand-600` etc. throughout `globals.css`) — the gap is only that success/warning/danger aren't yet named as first-class tokens, so today's admin UI likely improvises ad hoc greens/reds. Add them to `tailwind.config.js` `theme.extend.colors` before the next component that needs a status color.

### Typography

Current stack (`globals.css`) already establishes a clean scale via bare-tag rules — keep it, formalize it:

| Level | Class | Use |
|---|---|---|
| Display | `text-4xl font-semibold tracking-tight` | marketing hero only |
| H1 | `text-2xl font-semibold tracking-tight` (existing) | page titles |
| H2 | `text-xl font-semibold tracking-tight` (existing) | section headers |
| H3 | `text-lg font-semibold` (existing) | card/subsection headers |
| Body | `text-sm` / `text-base` | default text — audit existing components for consistent sizing, several older marketing components may use arbitrary sizes |
| Caption | `text-xs text-gray-500` | timestamps, helper text, form hints |

Font: no custom font is currently loaded (`app/layout.tsx` has no `next/font` import) — system font stack via Tailwind default. This is a legitimate, fast, zero-layout-shift choice for a test-taking product where performance matters more than brand typography; **do not add a custom webfont** without a specific reason, since it's pure downside (FOUT/FOIT risk) for an exam-timer-critical UI.

### Spacing

Standardize on Tailwind's default 4px scale (already in use) with these conventions:
- Card padding: `p-6` (desktop), `p-4` (mobile)
- Section vertical rhythm: `space-y-6` within a card, `space-y-12` between page sections
- Form field gaps: `space-y-4`

No custom spacing scale needed — Tailwind's default is sufficient and consistency comes from *convention*, not new tokens.

### Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| `rounded-md` (existing, on inputs/buttons) | 6px | default control radius — keep |
| `rounded-lg` | 8px | cards, modals, dropdowns |
| `rounded-full` | — | avatars, badges, pills |
| `shadow-sm` (existing, on inputs/buttons) | — | resting state |
| `shadow-md` | — | hover/raised state (dropdowns, popovers) |
| `shadow-lg` | — | modals only |

Keep shadows subtle — every reference product in the inspiration list uses near-flat elevation (1-2 step shadow scale, not skeuomorphic depth). Avoid introducing more than 3 shadow steps total.

### Motion

- Transitions: `transition-colors` / `transition-shadow`, `duration-150` for hover states, `duration-200` for panel/modal enter, ease-out.
- No animation library needed at current scale — Tailwind's transition utilities + `@keyframes` in `globals.css` for the rare bespoke case (e.g. a timer pulse when time is low) is sufficient. Avoid adding Framer Motion unless a specific interaction (drag-to-reorder in the question builder, page transitions) genuinely needs spring physics.
- **Respect `prefers-reduced-motion`** — add a global `@media (prefers-reduced-motion: reduce)` rule in `globals.css` disabling non-essential transitions. Not yet present; add alongside the next animation-touching change.

---

## 2. Components (conventions for new/refactored components — not a retrofit mandate)

### Buttons
Existing base-tag style in `globals.css:44-46` (`bg-brand-600` solid) is the primary button. Add, as utility classes applied per-instance (not new base-tag rules, to avoid the bare `<button>` selector becoming a dumping ground):
- **Secondary:** `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`
- **Destructive:** `bg-red-600 text-white hover:bg-red-700` — reserve for delete/irreversible actions only (e.g. the admin test-delete flow flagged in `PROJECT_ANALYSIS.md` §6/§9)
- **Ghost/tertiary:** `bg-transparent text-gray-700 hover:bg-gray-100`
- Always pair with `disabled:cursor-not-allowed disabled:opacity-50` (already global via base rule).

### Inputs
Existing base-tag style (`globals.css:38-42`) is solid — extend with an explicit **error state** convention not yet present: `border-red-400 focus:border-red-500 focus:ring-red-500/40` applied via a `aria-invalid:` variant so it's automatic from form validation state rather than manually toggled:
```
aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/40
```

### Cards
Not yet a named component — every screen that needs a card currently improvises a `div` with ad hoc classes. Introduce one shared `components/ui/Card.tsx`:
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
```
Use everywhere a bordered content block appears (dashboard attempt rows, admin test list rows, question group editor blocks) instead of re-deriving the same classes.

### Dialogs/Modals
None exist yet (confirmed — no modal component in `components/`). When the first one is needed (e.g. M1.3's create-test flow, or a delete-confirmation for the cascade-delete risk flagged in the analysis), build on the native `<dialog>` element or Radix Dialog primitive (headless, accessible-by-default, composes with existing Tailwind styling) rather than hand-rolling focus-trap logic.

### Tables
Existing base-tag styles (`globals.css:48-58`) are a reasonable default for the admin attempts list. Extend with:
- Zebra striping optional (`odd:bg-gray-50`) for long lists — apply only if row count regularly exceeds ~15 (admin attempts queue).
- Sticky header (`sticky top-0 bg-gray-100`) once any table is expected to scroll independently of the page (e.g. a large question bank).

### Status badges
New shared component needed (`components/ui/Badge.tsx`) — used for `AttemptStatus` (`IN_PROGRESS`/`SUBMITTED`/`EXPIRED`/`ABANDONED`), `Role`, and grading-pending states. Map each enum value to one of the semantic color tokens above (e.g. `SUBMITTED` → success, `IN_PROGRESS` → brand, `EXPIRED`/`ABANDONED` → neutral/danger) — **do not** let each screen invent its own status-to-color mapping; centralize it in one lookup so `AttemptStatus.EXPIRED` is always the same color everywhere it's shown.

### Charts
`BandProgressChart` (Recharts, existing) — keep Recharts as the charting library (already a dependency, no reason to add a second). Apply the same semantic color tokens (brand for the primary band line, success/warning bands for target-score reference lines if added later) rather than Recharts' default palette.

---

## 3. Dark Mode

Not present today (`tailwind.config.js` has no `darkMode` key). **Recommendation: defer, don't build speculatively** — this is a test-taking product where session length and readability under exam conditions matter more than aesthetic choice, and no user research here indicates demand. If prioritized later, use Tailwind's `class` strategy (not `media`) so it's user-controlled, not OS-inherited, since exam proctoring UIs generally shouldn't silently change appearance based on system settings mid-test.

## 4. Responsive Breakpoints

Use Tailwind defaults (`sm`/`md`/`lg`/`xl`) — no custom breakpoints needed. Specific rules:
- **Test engine (Listening/Reading split-screen):** collapse `ResizableSplitScreen` to a stacked (not side-by-side) layout below `md` — needs verification this already happens; flag for implementation-phase audit.
- **Admin CMS:** desktop-first is acceptable (content editors are not expected to build tests on mobile) — don't over-invest in mobile admin layouts relative to student-facing screens.
- **Marketing + dashboard:** must be fully responsive `sm` and up — these are the pages a prospective/actual student will hit on mobile.

## 5. Accessibility Standards

- All interactive elements keyboard-reachable with visible focus (`focus:ring-2 focus:ring-brand-500/40` already the pattern on inputs — extend to all custom interactive components, not just native form elements).
- Timer/countdown components (`CountdownTimer`) must expose remaining time to screen readers via `aria-live="polite"` on a low-frequency-updating region (not literally every second — that would spam announcements); verify current implementation during the test-engine accessibility pass.
- Audio player (`RestrictedAudioPlayer`) needs an accessible name and keyboard-operable controls — verify custom controls aren't mouse-only.
- Every form input needs a programmatically associated `<label>` (the base `label` rule exists — confirm `htmlFor`/`id` pairing is consistent, not just visual proximity).
- Color is never the only signal for status (pair badge color with text, e.g. "Submitted" label + green, not a bare green dot) — already true by necessity since `Badge` will always render text, just noting as a rule to preserve.
- Minimum contrast: verify `gray-500`-on-white text (used for captions) meets WCAG AA (4.5:1) at the sizes used — `gray-500` on white is borderline and should be checked, not assumed.

## 6. What NOT to do

- Do not introduce a second component library (Radix is the one exception explicitly allowed above, for headless modal primitives — no MUI/Chakra/Ant on top of Tailwind).
- Do not restyle the entire app in one pass. Apply these tokens/components only to screens actively being built or touched by a roadmap milestone — the CLAUDE.md mandate is incremental improvement, not a rewrite.
- Do not add a custom webfont, animation library, or dark mode without a concrete milestone driving it — each is a real cost (bundle size, complexity, or both) with no current demand signal.
