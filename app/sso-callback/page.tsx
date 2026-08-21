"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";
import { isSafeRedirectPath } from "@/lib/api/auth";
import { extractClerkErrorMessage } from "@/lib/api/clerkError";

/**
 * Where Google/Facebook redirect back to after the OAuth handshake. Built
 * by hand with Clerk's headless handleRedirectCallback() rather than the
 * prebuilt <AuthenticateWithRedirectCallback> — same "no default Clerk UI"
 * rule as the login/signup pages, even though this one has no meaningful
 * visual design to preserve (it's on-screen for a moment at most).
 *
 * Default destination is "/" (the app's own homepage), not a role home —
 * OAuth login's default landing spot is intentionally different from the
 * email/password flow's (see goToRoleHome in login/signup, unchanged). If
 * the visitor arrived at /login with a ?next= (e.g. bounced off a protected
 * route), login/page.tsx's handleOAuth carries it through as a query param
 * on this page's own URL — read and validated here the same way, through
 * the same isSafeRedirectPath() used everywhere else redirect targets are
 * validated, so this can't become a second, weaker open-redirect path.
 */
function SsoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    clerk
      .handleRedirectCallback({})
      .then(() => {
        if (cancelled) return;
        const next = searchParams.get("next");
        router.replace(next && isSafeRedirectPath(next) ? next : "/");
      })
      .catch((err) => {
        // Logged here (not just shown inline) so a failed OAuth handshake or
        // provisioning conflict is visible in server/error-tracking logs,
        // not just a message the user might dismiss.
        console.error("SSO callback failed:", err);
        Sentry.captureException(err);
        if (!cancelled) setError(extractClerkErrorMessage(err, "Sign-in failed"));
      });

    return () => {
      cancelled = true;
    };
  }, [clerk, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]" data-testid="sso-callback-page">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-red-700">{error}</p>
          <a href="/login" className="mt-2 inline-block text-sm text-[#20b2aa] hover:underline">
            Back to login
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Finishing sign-in…</p>
      )}
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <SsoCallbackContent />
    </Suspense>
  );
}
