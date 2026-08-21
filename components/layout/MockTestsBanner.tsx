// Honest, verifiable-by-the-product-itself claims — not invented usage
// counts. This is a new platform; it doesn't have real traffic numbers to
// report, so it doesn't claim any.
const STATS = [
  { value: "4", label: "skills covered", position: "left-6 top-8 sm:left-10 sm:top-10" },
  { value: "Free", label: "to get started", position: "right-6 top-8 sm:right-10 sm:top-10" },
  { value: "24/7", label: "practice access", position: "bottom-8 right-6 sm:bottom-10 sm:right-16" },
];

/**
 * Heading + stats banner for the practice-tests section. The center
 * composition is deliberately generic — no "IDP Partner Excellence Awards"
 * badge or British Council/IELTS-branded certificate. Those use two real
 * organizations' trademarks inside a document styled to look like an
 * authentic accreditation credential, which isn't something I'll build
 * regardless of restyling; see the left/right graphics below for the
 * honest stand-ins (a self-referential badge, and a preview of this
 * platform's own — clearly labeled as such — completion certificate).
 */
export function MockTestsBanner() {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <h2 className="text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
        Explore Our Collection of
        <br />
        <span className="text-[#00b4d8]">International Standard</span> IELTS Mock Tests
      </h2>
      <div className="mx-auto mt-4 flex max-w-xl items-center gap-3">
        <span className="h-px flex-1 bg-[#00b4d8]/40" aria-hidden="true" />
        <p className="text-sm text-gray-500">
          Our tests are designed to mirror the exact format, timing, and difficulty of the official exam.
        </p>
        <span className="h-px flex-1 bg-[#00b4d8]/40" aria-hidden="true" />
      </div>

      <div className="relative mt-12 min-h-[420px] overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-100 via-blue-100 to-indigo-100 shadow-xl">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />

        <div className="absolute inset-0 flex items-center justify-center gap-4 p-6">
          {/* Left: self-referential badge — no real third-party award program named */}
          <div className="hidden w-40 flex-col items-center rounded-2xl border border-white/60 bg-white/40 p-5 text-center shadow-xl backdrop-blur-md sm:flex">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#00b4d8]" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5 3.5 3.5 0 0 0 7.5 10H8M16 5h2.5A1.5 1.5 0 0 1 20 6.5 3.5 3.5 0 0 1 16.5 10H16" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v3m-3 4h6m-3 0v-4" />
            </svg>
            <p className="mt-3 text-xs font-bold uppercase leading-snug tracking-wide text-[#1b2a4a]">
              Top-Rated
              <br />
              Practice Platform
            </p>
          </div>

          {/* Right: sample preview of this platform's own completion certificate, clearly labeled as a preview */}
          <div className="w-72 rounded-2xl border border-white/70 bg-white/70 p-5 text-center shadow-xl backdrop-blur-md sm:w-80">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00b4d8]">Certificate of Completion</p>
            <p className="mt-2 text-sm font-bold text-[#1b2a4a]">IELTS Pathway Mock Test</p>
            <p className="mt-2 text-xs text-gray-500">
              Awarded to learners who complete a full Listening, Reading, Writing &amp; Speaking mock test.
            </p>
            <div className="mx-auto mt-4 h-px w-24 bg-gray-300" aria-hidden="true" />
            <p className="mt-2 text-[10px] text-gray-400">Sample preview — earn yours after your first full test</p>
          </div>
        </div>

        {STATS.map((stat) => (
          <div
            key={stat.value}
            className={`absolute z-10 ${stat.position} w-36 rounded-2xl border border-white/60 bg-white/40 p-6 text-center shadow-xl backdrop-blur-md sm:w-40`}
          >
            <p className="text-2xl font-extrabold text-[#1b2a4a] sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-[#1b2a4a]/80">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
