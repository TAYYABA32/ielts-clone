import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LiveLessonsBrowser } from "@/components/layout/LiveLessonsBrowser";

export const metadata: Metadata = {
  title: "Live Lessons | IELTS Pathway",
  description: "Free live IELTS lessons with industry experts, across Listening, Reading, Writing, and Speaking.",
};

export default function LiveLessonsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Live Lessons" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">Live Lessons</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Free live sessions with IELTS instructors, every week across all four skills.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={null}>
            <LiveLessonsBrowser />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
