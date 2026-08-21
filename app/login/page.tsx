"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { fetchCurrentUser, isSafeRedirectPath, roleHomePath } from "@/lib/api/auth";
import { extractClerkErrorMessage } from "@/lib/api/clerkError";
import { useRedirectIfSignedIn } from "@/lib/auth/useRedirectIfSignedIn";
import { isValidEmail } from "@/lib/validation/authValidation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FacebookGlyph, GoogleGlyph, MailIcon, PhoneIcon } from "@/components/icons/AuthIcons";

type LoginMethod = "email" | "phone";

// Fully resets the global base `button` styling (background/padding/shadow)
// for buttons that should look like plain text (the method tabs), rather
// than the default filled pill.
const TEXT_BUTTON_RESET = "bg-transparent shadow-none rounded-none px-0 py-0 justify-start hover:bg-transparent";

// Fixed-height, light-border input, overriding the global base `input`
// styling's own padding/border so every field in this form lines up at
// exactly the same height regardless of what's inside it.
const INPUT_CLASSES = "h-10 rounded-md border border-gray-300 px-3 py-0 text-sm shadow-none focus:border-brand-500 focus:ring-brand-500/40";

function tabClasses(isActive: boolean): string {
  const base = `${TEXT_BUTTON_RESET} flex items-center gap-2 border-b-2 pb-1 text-sm font-semibold transition-colors`;
  return isActive
    ? `${base} border-[#20b2aa] text-[#20b2aa]`
    : `${base} border-transparent text-gray-400 hover:text-gray-500`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const checkingSession = useRedirectIfSignedIn();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const goToRoleHome = async () => {
    const user = await fetchCurrentUser();
    const next = searchParams.get("next");
    router.push(next && isSafeRedirectPath(next) ? next : roleHomePath(user.role));
    router.refresh();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loginMethod === "phone") {
      setError("Phone login isn't available yet — please use email.");
      return;
    }
    if (!isLoaded || isSubmitting) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status !== "complete") {
        // Covers 2FA/other multi-step flows this form doesn't build UI for yet.
        throw new Error("This account requires additional verification that isn't supported here yet.");
      }
      await setActive({ session: result.createdSessionId });
      await goToRoleHome();
    } catch (err) {
      console.error("Login failed:", err);
      setError(extractClerkErrorMessage(err, "Login failed"));
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_google" | "oauth_facebook") => {
    if (!isLoaded) return;
    setSocialNotice(null);
    try {
      // Full-page redirect to the provider; the browser navigates away here,
      // then comes back to /sso-callback once the provider redirects back.
      // Carries this page's own ?next= (if present and safe) as a query
      // param on the callback URL so a visitor who arrived here from a
      // protected route (e.g. /login?next=/dashboard) still ends up there
      // after OAuth, not just at the default post-login destination.
      const next = searchParams.get("next");
      const callbackUrl = next && isSafeRedirectPath(next) ? `/sso-callback?next=${encodeURIComponent(next)}` : "/sso-callback";
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: callbackUrl,
        redirectUrlComplete: callbackUrl,
      });
    } catch (err) {
      setSocialNotice(extractClerkErrorMessage(err, "Social login isn't available right now."));
    }
  };

  // Never render a submittable form until we're sure there's no active
  // session — this is what actually prevents the "You're already signed
  // in" Clerk error: that error only happens because the old form let an
  // already-authenticated visitor call signIn.create() at all.
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]" data-testid="login-page">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa]" data-testid="login-page">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-10">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="inline-block no-underline hover:no-underline">
            <BrandLogo />
          </Link>
        </div>

        <h1 className="mb-10 text-center text-2xl font-extrabold tracking-wide text-[#2b3e50]">LOG IN TO YOUR ACCOUNT</h1>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Left column: tabs + form */}
          <div>
            <div className="mb-4 flex items-center gap-4">
              <button type="button" onClick={() => setLoginMethod("phone")} className={tabClasses(loginMethod === "phone")}>
                <PhoneIcon className="h-4 w-4" />
                Login by phone
              </button>
              <span className="pb-2 text-gray-300">|</span>
              <button type="button" onClick={() => setLoginMethod("email")} className={tabClasses(loginMethod === "email")}>
                <MailIcon className="h-4 w-4" />
                Login by email
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loginMethod === "email" ? (
                <div>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Please enter Username/Email"
                    className={INPUT_CLASSES}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="Please enter phone number"
                    className={INPUT_CLASSES}
                  />
                </div>
              )}

              <div>
                <label htmlFor="password">Password</label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={loginMethod === "email"}
                  autoComplete="current-password"
                  placeholder="Please enter password"
                  className={INPUT_CLASSES}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-[#2b4263] py-2.5 font-semibold text-white hover:bg-[#1f314a]"
              >
                {isSubmitting ? "Logging in…" : "Login"}
              </button>

              <Link href="/forgot-password" className="inline-block text-sm text-[#20b2aa] no-underline hover:underline">
                Forgot password?
              </Link>
            </form>
          </div>

          {/* Divider */}
          <div className="relative hidden md:block">
            {/* top-0 bottom-0 rather than h-full: percentage height on an
                absolutely-positioned child doesn't reliably resolve against
                a grid-stretched auto-height parent — inset-based sizing does. */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gray-200" />
            <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-xs font-semibold text-[#2b3e50]">
              Or
            </span>
          </div>

          {/* Right column: social buttons — flat solid color, icon + label centered as a group */}
          <div className="flex flex-col justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("oauth_google")}
              className="flex h-10 w-full items-center justify-center gap-3 rounded bg-[#ea4335] py-0 hover:bg-[#d33a2c]"
            >
              <GoogleGlyph className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#ea4335]" />
              <span className="text-sm font-semibold text-white">Login with Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("oauth_facebook")}
              className="flex h-10 w-full items-center justify-center gap-3 rounded bg-[#4c76be] py-0 hover:bg-[#3d63a6]"
            >
              <FacebookGlyph className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4c76be]" />
              <span className="text-sm font-semibold text-white">Login with Facebook</span>
            </button>
            {socialNotice && <p className="text-center text-sm text-gray-500">{socialNotice}</p>}
          </div>
        </div>

        <p className="mb-6 mt-12 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-[#2b4263] no-underline hover:underline">
            Create one now!
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
