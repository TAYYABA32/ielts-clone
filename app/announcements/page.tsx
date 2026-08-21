import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ANNOUNCEMENTS } from "@/lib/data/announcements";

export const metadata: Metadata = {
  title: "Announcements | IELTS Pathway",
  description: "What's new on IELTS Pathway.",
};

export default function AnnouncementsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Announcements" }]} />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">Announcements</h1>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          {ANNOUNCEMENTS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <time dateTime={item.date} className="text-xs font-semibold uppercase tracking-wide text-[#00a8cc]">
                {item.date}
              </time>
              <h2 className="mt-2 text-lg font-bold text-[#1b2a4a]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
