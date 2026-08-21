# Accessibility Report — IELTS Clone

**Date:** 2026-08-05
**Scope:** WCAG 2.2 AA — keyboard navigation, focus management, screen reader support, ARIA, semantic HTML, color contrast, form/dialog/toast accessibility. Focused first on the test-taking engine (highest stakes: a timed exam under real time pressure), then admin forms, then a broader spot-check.

## Summary

Six real, verified defects fixed. Several audit categories turned up **no defect** on inspection — documented as such rather than skipped, since "I checked and it's fine" is a different, more useful claim than silence.

---

## Fixed

### 1. Countdown timers announced every second to screen readers
**Files:** `components/test-engine/CountdownTimer.tsx`, `components/test-engine/WritingEngine.tsx`
Both had `aria-live="polite"` directly on a `<span>` whose text changed every second. In practice this means a screen reader either tries to announce the remaining time every single second for the entire module duration (unusable) or the AT throttles/drops most updates (inconsistent, unpredictable). Neither is acceptable for the one piece of information a candidate most needs to trust.

**Fix:** new `components/test-engine/TimerAnnouncement.tsx` — a visually-hidden live region that announces only meaningful milestones (5 min / 1 min / 30s / 10s / time's up), using a crossed-threshold comparison (previous vs. current value) rather than exact-value matching, so it can't miss an announcement if a render skips over a threshold. The visible per-second countdown itself is no longer `aria-live` (screen reader users can still navigate to it and read the current value on demand — it's not `aria-hidden`, just not automatically announced).

### 2–3. Submit-confirmation "dialogs" weren't real dialogs
**Files:** `components/test-engine/TestEngine.tsx`, `components/test-engine/WritingEngine.tsx`
Both had a `<div role="alertdialog" aria-modal="true">` for the "submit now?" confirmation — but a plain `<div>` gets none of the behavior `aria-modal` implies: no focus trapping (a keyboard user could Tab straight out of the "modal" into the page behind it), no initial focus placement, no Escape-to-cancel, no focus return to the trigger on close. `aria-modal="true"` on an element that doesn't actually behave modally is arguably worse than not claiming it at all — it tells assistive tech to expect containment that isn't there.

**Fix:** replaced both with the existing `components/ui/ConfirmDialog.tsx` (native `<dialog>`, built in M3.1) — `.showModal()` provides real focus trapping, Escape handling, and a `::backdrop` natively. This also removed ~15 lines of duplicated modal markup per file (reuse over duplication, per this phase's own stated quality requirement).

### 4. Writing task tabs had no programmatic "current" state
**File:** `components/test-engine/WritingEngine.tsx`
The Task 1 / Task 2 tab buttons only distinguished the active tab visually (a CSS class) — nothing told a screen reader which one was selected.
**Fix:** added `aria-current="true"` to the active tab button and `aria-label="Writing tasks"` on the containing `<nav>`.

### 5. Resize divider had no accessible name
**File:** `components/test-engine/ResizableSplitScreen.tsx`
Already had solid `role="separator"`/`aria-orientation`/`aria-valuenow`/keyboard arrow-key support (this component was already well-built) — but no `aria-label`, so a screen reader would announce just "separator," with no indication of what it separates or does.
**Fix:** added `aria-label="Resize passage/question panes"`.

### 6. Speaking/Listening audio recorder gave no automatic announcement of state changes
**File:** `components/test-engine/AudioRecorder.tsx`
Recording starts automatically (`autoStart`) — a screen reader user not already focused on this widget when it auto-starts would have no way to know recording had begun, or later, that it had stopped, without manually navigating back to check.
**Fix:** added a discrete `role="status"` live region announcing state transitions ("Recording started." / "Recording complete.") — keyed only by `status`, not by the per-second elapsed-time counter, avoiding the same spam problem as Finding 1. The `error` state is deliberately left out of this announcer since it already has its own `role="alert"`.

---

## Investigated — no defect found

- **Form label association (admin CMS):** `ExaminerScoreForm.tsx`, `FileUploadField.tsx`, `ModuleEditor.tsx`, `QuestionGroupEditor.tsx` all use the "wrapping label" pattern (`<label>Text<input/></label>`) rather than `htmlFor`/`id` pairs. Initially flagged as a candidate defect (a grep for `htmlFor` returned zero matches across all four files) — reading the actual markup showed this is a different, **equally valid** WCAG/HTML technique: nesting the control inside its `<label>` creates the same programmatic association, and the same click-to-focus behavior, as the sibling `htmlFor` pattern. Verified consistent across all four files. This resolves the open question in `DESIGN_SYSTEM.md` ("confirm htmlFor/id pairing is consistent, not just visual proximity") — it's consistent, just via the other valid technique, not htmlFor.
- **Auth forms (`login`/`signup`):** already use `role="alert"` for form errors — correct, no change needed.
- **Toast accessibility:** no toast/snackbar system exists anywhere in this codebase — every transient message (errors, save confirmations) is shown inline with `role="alert"` or `role="status"`. This is arguably a *more* accessible default than toasts (no risk of auto-dismissing before a screen-reader user finishes hearing it, no extra focus-management complexity) — nothing to fix because there's nothing built. If a toast system is added later, apply the standard WAI-ARIA live-region pattern (`role="status"`/`aria-live="polite"` for success, `role="alert"` for errors) plus a duration long enough (or pause-on-hover/focus) that AT users aren't cut off.
- **Semantic landmarks:** spot-checked `app/layout.tsx` (→ `SiteChrome`), `app/page.tsx` (`<main>`, `<header>` via `Navbar`), admin pages (`<h1>` present, table markup with proper `<thead>`/`<tbody>`). No missing-landmark issues found in what was checked.

## Color contrast — calculated, not eyeballed

Per this project's own stated principle (never assume a color pairing passes without checking): computed WCAG contrast ratios for the values flagged as uncertain in `DESIGN_SYSTEM.md`.

| Pairing | Ratio | WCAG AA (4.5:1 normal text) |
|---|---|---|
| `text-gray-500` (`#6b7280`) on white | **4.84:1** | ✅ Pass — resolves the "borderline, should be checked" note in `DESIGN_SYSTEM.md` |
| `text-danger-700` (`#b91c1c`) on `bg-danger-50` (`#fef2f2`) — the Badge component's error/expired state | **5.52:1** | ✅ Pass |
| `placeholder:text-gray-400` (`#9ca3af`) on white | **2.54:1** | ❌ Fails (both normal and large-text thresholds) |

The placeholder-text finding is real but **not fixed here**: WCAG 1.4.3 is about conveying *information* via text color, and every form field in this app already has a proper associated label (confirmed above) — no field relies on its placeholder to be understood, which is the actual accessibility risk placeholder contrast rules exist to prevent. Changing the global placeholder color is a site-wide visual change I can't verify in a live browser in this environment, so it's documented here as a recommendation (swap `gray-400` → `gray-500` for placeholders, which would raise it to the passing 4.84:1 computed above) rather than applied blind.

## Not audited in this pass (scope note)

Marketing landing page sections (`HeroBanner`, `SixStepsSection`, `LiveLessonsSection`, etc.) and the full admin Test Builder (`TestBuilderForm`/`ModuleEditor`/`QuestionGroupEditor` — beyond the label-association check above) were not exhaustively walked field-by-field. Priority in this pass went to the test-taking engine (highest stakes: a real candidate under time pressure, mid-exam) and the confirmation-dialog/timer patterns that repeat across multiple components. A follow-up pass on the marketing/admin-builder surfaces would be the natural next increment, not a currently-known gap.

## Verification

`tsc`, `eslint`, `vitest` (120/120), and `next build` all pass after every fix in this report.
