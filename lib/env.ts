import { z } from "zod";

/**
 * Only truly hard-required variables belong here — everything this app
 * already treats as optional-with-fail-safe-behavior (Sentry, Resend,
 * Upstash) is deliberately NOT validated as required: those already degrade
 * gracefully (no-op provider, fail-open rate limiting) rather than crashing,
 * and forcing them here would contradict that design. This schema exists
 * to fail fast, with a clear message, on the variables the app genuinely
 * cannot run without — not to gate-keep every optional integration.
 */
const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

/** Throws a clear, actionable error naming every missing variable — call once at process startup (see instrumentation.ts), not per-request. */
export function validateRequiredEnv(): void {
  const result = requiredEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Missing or empty required environment variable(s): ${missing}. See .env.example for what each one is for.`
    );
  }
}
