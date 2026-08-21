export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "CONTENT_EDITOR" | "ADMIN";
}

const FETCH_TIMEOUT_MS = 8000;

/**
 * Clerk's client-side user object doesn't know our app-specific `role` —
 * that only exists in our own database. Call this right after a Clerk
 * sign-in/sign-up completes (setActive({ session })) to find out where to
 * send the user.
 *
 * Bounded with an explicit timeout: a bare `fetch()` with no AbortController
 * can hang indefinitely on a slow/stuck connection, and every caller of this
 * function (useRedirectIfSignedIn's initial-session check included) only
 * has a `.catch()` to fall back on — a hang, as opposed to a rejection,
 * never reaches it. That's what turns "the DB is slow right now" into
 * /login being stuck on a loading state forever instead of just showing
 * the form after a timeout.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch("/api/auth/me", { signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? `Failed to load profile (status ${response.status})`);
    }
    return data.user;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Loading your profile timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function roleHomePath(role: AuthUser["role"]): string {
  return role === "ADMIN" || role === "CONTENT_EDITOR" ? "/admin" : "/dashboard";
}

/**
 * Guards the login page's `?next=` redirect target against open redirects.
 * A plain `path.startsWith("/")` check is NOT sufficient — "//evil.com"
 * also starts with "/", but browsers resolve a leading "//" as
 * protocol-relative (i.e. it navigates off-site, inheriting the current
 * protocol). Also rejects a leading "/\" — some browsers normalize a
 * backslash to a forward slash, which is the same bypass in disguise.
 */
export function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}
