import type { RateLimitConfig } from "./limiter";

/**
 * Named rate-limit tiers, one per route "shape" rather than per literal
 * route — every module-submission endpoint shares `submit`, every admin CRUD
 * route shares `admin`, etc., so tightening/loosening a whole category is a
 * one-line change here instead of hunting through every route file. A route
 * with genuinely different needs can still be given its own `RateLimitConfig`
 * inline instead of using one of these.
 *
 * Starting values, not measured production traffic — tune once real usage
 * data exists.
 */
export const RATE_LIMIT_TIERS = {
  /** GET /api/auth/me — called once per sign-in/sign-up; also doubles as JIT user provisioning. */
  auth: { name: "auth", limit: 20, window: "60 s" },
  /** Admin content upload + candidate speaking-recording upload — infrequent, heavy (file transfer). */
  upload: { name: "upload", limit: 10, window: "60 s" },
  /** Listening/Reading/Writing module submission — a few per test attempt, generous headroom for retry-on-error. */
  submit: { name: "submit", limit: 20, window: "60 s" },
  /** Autosave progress ping — called periodically while a candidate is mid-module, needs a high ceiling. */
  autosave: { name: "autosave", limit: 60, window: "60 s" },
  /** Admin CMS CRUD (tests/modules/attempts) — interactive, higher-frequency usage than candidate-facing routes. */
  admin: { name: "admin", limit: 60, window: "60 s" },
  /** Public, unauthenticated contact form — tight limit since there's no account/session behind it to rely on for abuse control. */
  contact: { name: "contact", limit: 5, window: "60 s" },
} as const satisfies Record<string, RateLimitConfig>;
