"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Catches errors in the ROOT LAYOUT itself (e.g. ClerkProvider or SiteChrome
 * throwing) — app/error.tsx's boundary sits inside the root layout, so it
 * can't catch failures in the layout that renders it. Next.js requires this
 * file to render its own complete <html>/<body> (it replaces the root
 * layout entirely while active), and to be a Client Component.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 text-center">
        <h1 className="mb-2 text-xl font-bold text-[#2b3e50]">Something went wrong</h1>
        <p className="mb-6 max-w-sm text-sm text-gray-600">
          A critical error occurred loading this page. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded bg-[#2b3e50] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f2e3d]"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
