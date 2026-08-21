import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "./Navbar";
import type { AuthUser } from "@/lib/api/auth";

/**
 * Async Server Component wrapping the (sync, presentational) Navbar — split
 * out so the homepage can stream: everything else on the page is fully
 * static and can paint immediately, while this one component's DB-backed
 * auth check resolves independently inside its own <Suspense> boundary (see
 * app/page.tsx). Previously the whole page awaited this lookup before
 * anything rendered.
 */
export async function NavbarAsync() {
  let user: AuthUser | null = null;
  try {
    const dbUser = await getCurrentUser();
    user = dbUser ? { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role } : null;
  } catch (error) {
    // Same "degrade gracefully" reasoning the homepage already applied here:
    // a DB hiccup shouldn't crash the page, worst case a signed-in visitor
    // briefly sees the signed-out header.
    // eslint-disable-next-line no-console -- server-side diagnostic, not user-facing
    console.error("Failed to resolve current user for navbar:", error);
  }
  return <Navbar user={user} />;
}
