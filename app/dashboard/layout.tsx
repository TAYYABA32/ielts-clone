import type { Metadata } from "next";
import type { ReactNode } from "react";

// Auth-gated (middleware.ts), no public content — see app/robots.ts / SEO_REPORT.md.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
