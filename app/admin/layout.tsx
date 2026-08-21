import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// Auth-gated (middleware.ts), no public content — see app/robots.ts / SEO_REPORT.md.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ADMIN_NAV_LINKS = [
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/attempts", label: "Attempts" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl gap-6 text-sm font-medium text-gray-600">
          {ADMIN_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
