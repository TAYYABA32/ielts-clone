function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 13l2 2 4-4" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M11 20V4M18 20v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20h20" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: MonitorIcon,
    accent: "text-[#00b4d8] bg-cyan-50",
    title: "Authentic Test Interface",
    description: "The same timing, layout, and audio controls you'll see on test day.",
  },
  {
    icon: BoltIcon,
    accent: "text-amber-500 bg-amber-50",
    title: "Instant Results",
    description: "Listening and Reading are auto-graded the moment you submit.",
  },
  {
    icon: ClipboardCheckIcon,
    accent: "text-emerald-600 bg-emerald-50",
    title: "Detailed Explanations",
    description: "Review every question with a full breakdown of the correct answer.",
  },
  {
    icon: CpuIcon,
    accent: "text-fuchsia-600 bg-fuchsia-50",
    title: "AI-Assisted Scoring",
    description: "Get quick feedback on grammar, vocabulary, and coherence in Writing.",
  },
  {
    icon: ChartIcon,
    accent: "text-rose-600 bg-rose-50",
    title: "Progress Tracking",
    description: "Watch your band score trend across every attempt on your dashboard.",
  },
];

/** Feature grid — matches the reference site's "why practice here" showcase. */
export function FeaturesShowcaseSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
            Built for <span className="text-[#00b4d8]">Real Test-Day Confidence</span>
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Every feature exists to make practice feel like the real exam, not a guessing game.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-2xl border border-blue-50 bg-white p-6 text-center shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${feature.accent}`}>
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-[#1b2a4a]">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
