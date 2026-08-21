import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CollectionBrowser } from "@/components/collection/CollectionBrowser";

export const metadata: Metadata = {
  title: "IELTS Exam Library | IELTS Pathway",
  description: "Browse the full IELTS Exam Library — search, filter by category and skill, and sort by popularity.",
  alternates: { canonical: "/collection" },
};

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>
      <ScrollToTopButton />

      <section className="bg-white px-[15px]">
        <div className="mx-auto max-w-[1170px]">
          <div className="pb-[6px] pt-[15px]">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "IELTS Exam Library" }]} />
          </div>
          <h1 className="my-4 text-[32px] font-bold text-[#1b2a4a] md:my-12 md:text-[48px]">IELTS Exam Library</h1>
        </div>
      </section>

      <section className="px-[15px] pb-16">
        <div className="mx-auto max-w-[1170px]">
          <Suspense fallback={null}>
            <CollectionBrowser />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
