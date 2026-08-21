"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Route-segment error boundary (catches errors in page content, below the
 * root layout — see app/global-error.tsx for errors in the root layout
 * itself, which this file's boundary can't reach). Next.js requires this to
 * be a Client Component. Catches anything an earlier fix missed (or a
 * future regression) so a visitor sees a recoverable message instead of a
 * raw stack trace or a blank crash — the same "degrade gracefully"
 * reasoning already applied to the homepage's individual data-loading
 * calls, just as a final backstop.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 text-center">
      <h1 className="mb-2 text-xl font-bold text-[#2b3e50]">Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm text-gray-600">
        This page hit an unexpected error — often a temporary connection hiccup. Try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-[#2b3e50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f2e3d]"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#2b3e50] no-underline hover:border-gray-400 hover:no-underline"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
