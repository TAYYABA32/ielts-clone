import type { TestCollectionItem } from "@/lib/data/mockTestCollection";

export function StarRating({ rating }: { rating: number }) {
  const filledStars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <span aria-hidden="true" className="tracking-tight text-amber-400">
        {"★".repeat(filledStars)}
        <span className="text-gray-300">{"★".repeat(5 - filledStars)}</span>
      </span>
      <span className="text-xs font-semibold text-[#1b2a4a]">{rating.toFixed(1)}</span>
    </div>
  );
}

/** The small "IOT Online Tests.com" tag shared by both poster variants. */
function PosterTag() {
  return (
    <div className="relative flex justify-end">
      <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-cyan-200">
        IOT Online Tests.com
      </span>
    </div>
  );
}

type TestPosterProps = Pick<TestCollectionItem, "month" | "year" | "badgeColor" | "variant">;

/** Pure-CSS/SVG test cover poster — no photos or icon fonts, just typography, gradients, and simple shapes. */
export function TestPoster({ month, year, badgeColor, variant }: TestPosterProps) {
  if (variant === "slate") {
    return (
      <div className="relative flex aspect-square flex-col overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-3">
        {/* Geometric circle accents */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-12 h-10 w-10 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute left-10 top-1/2 h-6 w-6 rounded-full border border-white/10" />
        {/* Green bottom accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-2xl"
        />

        <PosterTag />

        <div className="relative flex flex-1 flex-col justify-center">
          <p className="text-xl font-extrabold leading-none text-white">IELTS</p>
          <p className="mt-1 text-xl font-extrabold leading-none text-white">MOCK TEST</p>
          <p className="mt-2 text-xl font-extrabold leading-none text-white">{year}</p>
        </div>

        {/* Circular month badge, bottom-right of the cover graphic */}
        <div className="relative flex justify-end">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full ${badgeColor} text-center text-[10px] font-bold uppercase leading-tight text-white shadow-lg`}
          >
            {month}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex aspect-square flex-col overflow-hidden rounded-xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-3">
      {/* Rounded bottom accent lines */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 60"
        fill="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-cyan-300/10"
      >
        <path d="M-10 40 Q 50 10 100 40 T 210 40" stroke="currentColor" strokeWidth="4" />
        <path d="M-10 55 Q 50 25 100 55 T 210 55" stroke="currentColor" strokeWidth="4" />
      </svg>

      <PosterTag />

      <div className="relative flex flex-1 flex-col justify-center">
        <p className="text-xl font-extrabold leading-none text-white">IELTS</p>
        <p className="mt-1 text-xl font-extrabold leading-none text-white">MOCK TEST</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xl font-extrabold leading-none text-white">{year}</p>
          <span className={`rounded-full ${badgeColor} px-2.5 py-1 text-[10px] font-bold text-white`}>{month}</span>
        </div>
      </div>
    </div>
  );
}
