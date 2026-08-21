import Link from "next/link";
import { MOCK_TEST_COLLECTION } from "@/lib/data/mockTestCollection";
import { StarRating, TestPoster } from "@/components/collection/TestPoster";

const PREVIEW_CARDS = MOCK_TEST_COLLECTION.slice(0, 4);

function ArrowCta({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full bg-[#1e293b] px-8 py-3.5 text-sm font-bold text-white no-underline hover:bg-[#14213a] hover:no-underline"
    >
      {children}
      <span aria-hidden="true" className="ml-3 flex items-center justify-center rounded-full bg-[#00b4d8] p-2.5 text-white">
        ↗
      </span>
    </Link>
  );
}

export function OfficialMaterialsSection() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="flex justify-center">
        <ArrowCta href="#tests">GET FREE IELTS MOCK TEST</ArrowCta>
      </div>

      <div className="mt-14 text-left">
        <h2 className="text-4xl font-light text-[#2d3748] md:text-5xl">
          2026 Official <span className="font-normal text-[#00b4d8]">IELTS Practice Materials</span>
        </h2>
        <p className="mt-3 text-left text-sm text-gray-500">Boost Your Preparation with Real Test Questions &amp; Mock Exams</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PREVIEW_CARDS.map((card) => (
          <Link
            key={card.id}
            href="/collection"
            className="block rounded-2xl border border-gray-100 bg-white p-3 text-left no-underline shadow-md transition-transform hover:-translate-y-1 hover:no-underline hover:shadow-lg"
          >
            <TestPoster month={card.month} year={card.year} badgeColor={card.badgeColor} variant={card.variant} />
            <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold text-[#1b2a4a]">{card.title}</p>
            <div className="mt-2 flex items-center justify-between">
              <StarRating rating={card.rating} />
              <span className="text-xs text-gray-400">({card.votes.toLocaleString()} votes)</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <ArrowCta href="/collection">EXPLORE MORE</ArrowCta>
      </div>
    </div>
  );
}
