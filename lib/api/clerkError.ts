interface ClerkErrorItem {
  code?: string;
  message?: string;
  longMessage?: string;
}

interface ClerkLikeError {
  errors?: ClerkErrorItem[];
}

function isClerkLikeError(err: unknown): err is ClerkLikeError {
  return typeof err === "object" && err !== null && "errors" in err;
}

/**
 * Clerk error codes mapped to copy this app actually wants to show a user,
 * instead of forwarding Clerk's own wording (which ranges from fine to
 * confusing/technical — e.g. `session_exists` surfaces as the literal
 * string "You're already signed in.", and `form_identifier_exists` doesn't
 * tell the visitor what to do next). Codes not listed here fall through to
 * Clerk's own longMessage/message, which is usually reasonable as-is (e.g.
 * password-too-short messages already read fine unedited).
 * Reference: https://clerk.com/docs/custom-flows/error-handling
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  session_exists: "You're already signed in.",
  form_identifier_exists: "An account with this email already exists. Please log in instead.",
  form_password_incorrect: "Incorrect email or password.",
  form_identifier_not_found: "Incorrect email or password.",
  form_code_incorrect: "That code is incorrect. Please check it and try again.",
  captcha_invalid: "We couldn't verify you're not a robot. Please try again.",
  captcha_unavailable: "Verification is temporarily unavailable. Please try again in a moment.",
};

/** Clerk throws an object with an `errors` array rather than a plain Error; this pulls out a message worth showing a user either way. */
export function extractClerkErrorMessage(err: unknown, fallback: string): string {
  if (isClerkLikeError(err)) {
    const first = err.errors?.[0];
    const friendly = first?.code ? FRIENDLY_MESSAGES[first.code] : undefined;
    if (friendly) return friendly;
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  // Browser fetch failures (offline, DNS, CORS, Clerk's frontend-API
  // unreachable) throw a plain TypeError per the Fetch API spec, not a
  // Clerk-shaped error — its raw message ("Failed to fetch") isn't useful
  // to a visitor, unlike the deliberately-written Error messages this app
  // throws itself (e.g. "This account requires additional verification…"),
  // which should still show verbatim.
  if (err instanceof TypeError) return "Something went wrong. Please try again.";
  if (err instanceof Error) return err.message;
  return fallback;
}
