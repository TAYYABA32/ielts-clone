import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms & Conditions | IELTS Pathway",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">Terms &amp; Conditions</h1>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            IELTS Pathway is an independent, non-commercial demonstration platform. It is not affiliated with,
            endorsed by, or connected to the British Council, IDP Education, Cambridge Assessment English, or any
            official IELTS test administrator.
          </p>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Practice only</h2>
            <p className="mt-2">
              Mock test results, band scores, and examiner feedback on this platform are for practice purposes only.
              They are not official IELTS results and carry no validity for visa, immigration, academic, or
              employment purposes.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Your account</h2>
            <p className="mt-2">
              You&apos;re responsible for keeping your login credentials secure. Don&apos;t share your account, and let us
              know through the Contact page if you believe your account has been accessed without authorization.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Content submitted by you</h2>
            <p className="mt-2">
              Writing responses and Speaking recordings you submit are used only to score your own practice attempts
              and, where applicable, for examiner review within this platform.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1b2a4a]">Changes</h2>
            <p className="mt-2">
              As this is an actively developed demonstration project, these terms and the platform&apos;s features may
              change without advance notice.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
