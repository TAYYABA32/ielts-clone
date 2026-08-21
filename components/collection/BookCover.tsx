const VARIANT_GRADIENTS: Record<"teal" | "slate", string> = {
  teal: "from-teal-900 via-teal-800 to-slate-900",
  slate: "from-slate-800 via-slate-900 to-slate-950",
};

/**
 * Pure-CSS "book" cover — a faux page-edge strip on the right and a
 * darkened spine strip on the left simulate a 3D volume, no photos or
 * external assets (same pure-CSS/SVG approach as TestPoster).
 */
export function BookCover({ year, variant }: { year: string; variant: "teal" | "slate" }) {
  return (
    <div className="relative mx-auto w-36 sm:w-44">
      {/* Page-edge strips, right side */}
      <div
        aria-hidden="true"
        className="absolute -right-1.5 top-1 h-[calc(100%-8px)] w-2 rounded-r bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300"
      />
      <div aria-hidden="true" className="absolute -right-0.5 top-1.5 h-[calc(100%-12px)] w-1 rounded-r bg-gray-50" />

      <div
        className={`relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br p-4 shadow-2xl ring-1 ring-black/10 transition-transform duration-300 hover:-translate-y-1 ${VARIANT_GRADIENTS[variant]}`}
      >
        {/* Spine shadow, left edge */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-black/25" />

        <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">IELTS</p>
        <div className="relative">
          <p className="text-lg font-extrabold leading-tight text-white">Mock Test</p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{year}</p>
        </div>
        <p className="relative text-[9px] font-semibold uppercase tracking-widest text-white/50">Official Volume</p>
      </div>
    </div>
  );
}
