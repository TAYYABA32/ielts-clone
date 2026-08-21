import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { IELTS_TIP_CATEGORIES } from "@/lib/data/ieltsTips";

export const metadata: Metadata = {
  title: "IELTS Tips | IELTS Pathway",
  description: "Practical, skill-by-skill IELTS exam technique — Listening, Reading, Writing, Speaking, and Grammar.",
};

export default function IeltsTipsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "IELTS Tips" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">IELTS Tips</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Exam technique for every skill, written to be actually useful on test day.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {IELTS_TIP_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/ielts-tips/${category.slug}`}
              className="rounded-2xl border border-gray-100 bg-white p-6 no-underline shadow-md transition-transform hover:-translate-y-1 hover:no-underline hover:shadow-lg"
            >
              <h2 className="text-lg font-bold text-[#1b2a4a]">{category.label}</h2>
              <p className="mt-2 text-sm text-gray-500">{category.intro}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
