"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";

// Live test-taking screens (the actual timed Reading/Listening/Writing/
// Speaking modules) intentionally render distraction-free, full-viewport —
// no marketing footer, matching real exam software. Every other page gets
// the standard site chrome.
const CHROME_FREE_PREFIXES = ["/test/attempts/"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChromeFree = CHROME_FREE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (isChromeFree) return <>{children}</>;

  // Deliberately NOT a viewport-height flex/stretch layout: the footer
  // follows directly after whatever height the page content produces,
  // instead of being pinned to the bottom of the viewport. Pinning it left
  // a large dead-space gap above the footer on short pages like /login.
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
