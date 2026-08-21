import type { EmailMessage, EmailProvider } from "./types";
import { resendProvider } from "./resendProvider";
import { consoleProvider } from "./consoleProvider";

/**
 * Provider is chosen by EMAIL_PROVIDER ("resend" | "console"), defaulting to
 * "resend" but falling back to the console provider automatically if
 * RESEND_API_KEY isn't set — missing optional infrastructure should never
 * break the app. Add a new EmailProvider implementation (Postmark, SES,
 * etc.) and one branch here to swap providers; every call site depends only
 * on the EmailMessage/EmailProvider contract in types.ts, never on Resend
 * directly.
 */
function getProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER ?? "resend";
  if (configured === "console") return consoleProvider;
  if (configured === "resend" && !process.env.RESEND_API_KEY) return consoleProvider;
  return resendProvider;
}

/**
 * Sends best-effort — never throws. Notification delivery is deliberately
 * decoupled from whatever business action triggered it (e.g. a grading
 * action must succeed regardless of whether the follow-up email goes out).
 * Call this AFTER your own transaction commits, never from inside one — an
 * external API call has no place holding a DB transaction open, and this
 * repo has no serverless "run after the response" primitive available
 * (checked: this Next.js version doesn't export `unstable_after`), so an
 * awaited, try/caught call here is the only reliable way to guarantee the
 * request actually finishes sending before the function may be torn down.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    await getProvider().send(message);
  } catch (error) {
    // eslint-disable-next-line no-console -- server-side diagnostic; email failures must never fail the caller's action
    console.error("[sendEmail] failed", error);
  }
}
