import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Site Map | IELTS Pathway",
};

const SECTIONS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Exam Library", href: "/collection" },
      { label: "IELTS Tips", href: "/ielts-tips" },
      { label: "Live Lessons", href: "/live-lessons" },
      { label: "Announcements", href: "/announcements" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log In", href: "/login" },
      { label: "Sign Up", href: "/signup" },
      { label: "Forgot Password", href: "/forgot-password" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Site Map" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">Site Map</h1>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#00a8cc]">{section.heading}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-600 no-underline hover:text-[#1b2a4a] hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
