import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/observability/requestId";

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/dashboard(.*)", "/test(.*)"]);

/**
 * Route-level access control. Redirects unauthenticated visitors to /login
 * before any page code runs. This is a UX gate only — Clerk's session token
 * doesn't carry our app-specific `role`, and middleware runs on the Edge
 * runtime where we can't reach Postgres to look it up, so role enforcement
 * (admin-only routes) stays where it already lived: each admin page/route
 * calls requireAdmin() (lib/auth/session.ts), which re-reads the role from
 * the database on every request. Same reasoning for the "already logged
 * in → redirect off /login" convenience: that now lives in the login/signup
 * pages themselves, which run in the Node runtime and can hit the database.
 *
 * Also stamps every request with a correlation ID (generating one if the
 * client didn't send one) — set on both the outgoing request (so Route
 * Handlers/Server Components can read it via next/headers, see
 * lib/observability/requestId.ts) and the response (so it shows up in
 * browser devtools / client-side error reports for support correlation).
 */
export default clerkMiddleware(async (auth, request) => {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set(REQUEST_ID_HEADER, requestId);
      return redirectResponse;
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
