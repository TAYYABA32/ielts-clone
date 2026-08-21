"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { fetchCurrentUser, roleHomePath } from "@/lib/api/auth";
import { extractClerkErrorMessage } from "@/lib/api/clerkError";
import { useRedirectIfSignedIn } from "@/lib/auth/useRedirectIfSignedIn";
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/validation/authValidation";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const checkingSession = useRedirectIfSignedIn();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToRoleHome = async () => {
    const user = await fetchCurrentUser();
    router.push(roleHomePath(user.role));
    router.refresh();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidPassword(password)) {
      setError("Password must meet the required password requirements.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const lastName = rest.join(" ") || undefined;

      const result = await signUp.create({ emailAddress: email, password, firstName, lastName });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await goToRoleHome();
        return;
      }

      // Most Clerk instances require verifying the email before the account
      // is usable — send the code and show the verification step instead.
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Signup failed:", err);
      setError(extractClerkErrorMessage(err, "Signup failed"));
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status !== "complete") {
        throw new Error("That code didn't complete sign-up — double-check it and try again.");
      }
      await setActive({ session: result.createdSessionId });
      await goToRoleHome();
    } catch (err) {
      console.error("Signup verification failed:", err);
      setError(extractClerkErrorMessage(err, "Verification failed"));
      setIsSubmitting(false);
    }
  };

  // Never render a submittable form until we're sure there's no active
  // session — an already-signed-in visitor calling signUp.create() is
  // exactly what produces Clerk's raw "You're already signed in" error.
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <AuthCard title="Verify Your Email" subtitle={`Enter the code we sent to ${email}.`}>
        <form onSubmit={handleVerify} className="space-y-5" data-testid="signup-verify-page">
          <div>
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="one-time-code"
              placeholder="123456"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Verifying…" : "Verify & Continue"}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create Account" subtitle="Start your IELTS preparation in minutes.">
      <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-page">
        <div>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <span className="mt-1 block text-xs text-gray-500">At least {MIN_PASSWORD_LENGTH} characters</span>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/*
          Required by Clerk for Smart CAPTCHA bot protection on custom
          (non-prebuilt) sign-up flows — confirmed via this instance's live
          /v1/environment config (user_settings.sign_up.captcha_enabled:
          true, widget_type: "smart"). Clerk's script finds this exact id
          and renders the challenge into it; the prebuilt <SignUp/>
          component includes this automatically, but useSignUp() (used
          here) does not, so signUp.create() calls fail without it.
        */}
        <div id="clerk-captcha" />

        <button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account…" : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
