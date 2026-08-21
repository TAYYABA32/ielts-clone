"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchCurrentUser, roleHomePath } from "@/lib/api/auth";

/**
 * Guards /login and /signup against an already-authenticated visitor. Both
 * pages used to render their form unconditionally, so an already-signed-in
 * user submitting Sign Up would call signUp.create() with an active
 * session already present — Clerk rejects that with a raw "You're already
 * signed in" error instead of creating a second account. The actual fix is
 * upstream of the submit handler: never let that form be submittable in
 * the first place.
 *
 * Only acts on the FIRST time Clerk finishes loading (i.e. "was this
 * visitor already signed in when they landed on this page"), not on every
 * isSignedIn change for the lifetime of the component. Without that guard,
 * a normal successful sign-in on this same page — which flips isSignedIn
 * true via setActive() — would make this hook fire its own
 * router.replace(roleHomePath) at the same time the submit handler's own
 * goToRoleHome() is navigating, racing it. Whichever resolves second wins;
 * if it's this hook, a `?next=/some/deep/page` destination the submit
 * handler was respecting gets silently overwritten with the generic role
 * home. Gating on a ref that flips true after the first evaluation means
 * this hook only ever redirects a visitor who arrived already signed in —
 * a live sign-in transition is left entirely to the form's own handler.
 *
 * Returns true while Clerk is still loading OR a signed-in visitor is
 * being redirected away — callers should render a loading state (never the
 * form) for as long as this is true, and only render the real form once
 * it settles to false.
 */
export function useRedirectIfSignedIn(): boolean {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [checking, setChecking] = useState(true);
  const hasEvaluatedInitialAuth = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasEvaluatedInitialAuth.current) return;
    hasEvaluatedInitialAuth.current = true;

    if (!isSignedIn) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) router.replace(roleHomePath(user.role));
      })
      .catch(() => {
        // Clerk thinks there's a session but our own DB lookup failed —
        // render the form rather than get stuck on a loading state forever.
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  return !isLoaded || checking;
}
