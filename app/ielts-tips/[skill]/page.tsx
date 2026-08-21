import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { findTipCategory, IELTS_TIP_CATEGORIES } from "@/lib/data/ieltsTips";

interface PageProps {
  params: { skill: string };
}

export function generateStaticParams() {
  return IELTS_TIP_CATEGORIES.map((category) => ({ skill: category.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const category = findTipCategory(params.skill);
  if (!category) return { title: "IELTS Tips | IELTS Pathway" };
  return {
    title: `${category.label} | IELTS Pathway`,
    description: category.intro,
  };
}

export default function TipCategoryPage({ params }: PageProps) {
  const category = findTipCategory(params.skill);
  if (!category) notFound();

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>

      <section className="bg-white px-[15px] py-6">
        <div className="mx-auto max-w-[1170px]">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "IELTS Tips", href: "/ielts-tips" }, { label: category.label }]}
          />
          <h1 className="mt-2 text-2xl font-bold text-[#1b2a4a] sm:text-3xl">{category.label}</h1>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <p className="text-base leading-relaxed text-gray-600">{category.intro}</p>

          <ol className="mt-8 space-y-5">
            {category.tips.map((tip, index) => (
              <li key={tip} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-bold text-[#00a8cc]">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-[#1b2a4a]">{tip}</p>
              </li>
            ))}
          </ol>

          <a
            href="/collection"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#294563] px-6 py-3 text-sm font-bold text-white no-underline shadow-lg hover:bg-[#1d3146] hover:no-underline"
          >
            Practice with a mock test
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
