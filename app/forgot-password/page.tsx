"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { fetchCurrentUser, roleHomePath } from "@/lib/api/auth";
import { extractClerkErrorMessage } from "@/lib/api/clerkError";
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/validation/authValidation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { PasswordInput } from "@/components/auth/PasswordInput";

const INPUT_CLASSES =
  "h-10 rounded-md border border-gray-300 px-3 py-0 text-sm shadow-none focus:border-brand-500 focus:ring-brand-500/40";
const TEXT_BUTTON_RESET = "bg-transparent shadow-none rounded-none px-0 py-0 justify-start hover:bg-transparent";

type Step = "request" | "reset";

/**
 * Real password-reset flow using Clerk's headless useSignIn hook — the
 * same "reset_password_email_code" strategy Clerk's own prebuilt <SignIn>
 * component uses, just with this app's own UI (matching login/signup).
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email });
      setStep("reset");
    } catch (err) {
      console.error("Password reset code request failed:", err);
      setError(extractClerkErrorMessage(err, "Couldn't send a reset code to that email."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    if (!isValidPassword(newPassword)) {
      setError("Password must meet the required password requirements.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });
      if (result.status !== "complete") {
        throw new Error("This account requires additional verification that isn't supported here yet.");
      }
      await setActive({ session: result.createdSessionId });
      const user = await fetchCurrentUser();
      router.push(roleHomePath(user.role));
      router.refresh();
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(extractClerkErrorMessage(err, "Couldn't reset your password with that code."));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa]">
      <div className="mx-auto max-w-md px-4 pb-12 pt-10">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="inline-block no-underline hover:no-underline">
            <BrandLogo />
          </Link>
        </div>

        <h1 className="mb-8 text-center text-2xl font-extrabold tracking-wide text-[#2b3e50]">RESET YOUR PASSWORD</h1>

        {step === "request" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-sm text-gray-500">Enter your account email and we&apos;ll send you a reset code.</p>
            <div>
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
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
              {isSubmitting ? "Sending…" : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500">
              We sent a code to <strong>{email}</strong>. Enter it below along with your new password.
            </p>

            <div>
              <label htmlFor="reset-code">Reset code</label>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="one-time-code"
                placeholder="123456"
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="new-password">New password</label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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
              {isSubmitting ? "Resetting…" : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError(null);
              }}
              className={`${TEXT_BUTTON_RESET} text-sm text-[#20b2aa] hover:underline`}
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-[#20b2aa] no-underline hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
