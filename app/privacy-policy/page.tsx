import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy | IELTS Pathway",
};

/**
 * Genuinely describes what this app actually does with data — no
 * boilerplate legal text copied from elsewhere, and no claims about data
 * handling this codebase doesn't actually implement.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">Privacy Policy</h1>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            IELTS Pathway is an independent, non-commercial demonstration project. This page describes, honestly,
            what data the platform actually collects and how it&apos;s used — not a generic legal template.
          </p>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account details (name, email) via Clerk, our authentication provider, when you sign up or log in.</li>
              <li>Your test attempts, answers, and band scores, stored in our database so your dashboard can show your progress.</li>
              <li>
                Audio recordings you submit for Speaking test practice, stored via Supabase Storage so an examiner can
                review them.
              </li>
              <li>Messages you submit through the Contact form, sent to our support inbox — not stored in a database.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">What we don&apos;t do</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>We do not sell your data to third parties.</li>
              <li>We do not use your Speaking recordings for anything other than scoring your own practice attempts.</li>
              <li>We do not run advertising trackers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Cookies</h2>
            <p className="mt-2">
              We use a session cookie (managed by Clerk) so you stay logged in between visits. We don&apos;t use
              third-party advertising or analytics cookies.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Contact</h2>
            <p className="mt-2">
              Questions about your data can be sent through our{" "}
              <a href="/contact" className="text-[#00a8cc]">
                Contact page
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
