import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { ContactForm } from "@/components/contact/ContactForm";
import { OfficeInfoCard } from "@/components/contact/OfficeInfoCard";

export const metadata: Metadata = {
  title: "Contact Us | IELTS Pathway",
  description: "Get in touch with the IELTS Pathway team — questions about mock tests, courses, or live lessons.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>
      <ScrollToTopButton />

      <section className="bg-gradient-to-br from-[#eaf3fb] via-[#eef5fb] to-[#e3edf9] px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-[#1b2a4a] md:text-5xl">Get in touch today!</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 md:text-base">
          IELTS Pathway will get back to you within 24 hours.
        </p>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:p-8">
            <ContactForm />
          </div>
          <OfficeInfoCard />
        </div>
      </section>
    </main>
  );
}
