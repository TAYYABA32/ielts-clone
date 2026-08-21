import Link from "next/link";
import { YouTubePlayIcon } from "@/components/icons/CommonIcons";

function GaugeIcon() {
  return (
    <svg viewBox="0 0 120 70" className="mx-auto h-16 w-28" aria-hidden="true">
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
      <path d="M10 60 A50 50 0 0 1 82 16" fill="none" stroke="#00b4d8" strokeWidth="10" strokeLinecap="round" />
      <line x1="60" y1="60" x2="86" y2="26" stroke="#1b2a4a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="60" r="5" fill="#1b2a4a" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-amber-400" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
      <rect x="9" y="19" width="6" height="1.6" rx="0.8" />
      <rect x="9.5" y="21" width="5" height="1.4" rx="0.7" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-[#00b4d8]" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v14H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4h4M9 12h6M9 15.5h6M9 8.5h3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-fuchsia-500" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
      <path d="M19 15c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 0 1 7.5-1.9" />
    </svg>
  );
}

function ViewAllCta({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center self-start rounded-full bg-[#1e293b] px-5 py-2 text-xs font-bold text-white no-underline hover:bg-[#14213a] hover:no-underline"
    >
      VIEW ALL
      <span aria-hidden="true" className="ml-2 flex items-center justify-center rounded-full bg-[#00b4d8] p-1.5 text-white">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>
    </Link>
  );
}

interface StepCard {
  number: string;
  title: string;
  subtitle: string;
  graphic: React.ReactNode;
  ctaHref?: string;
}

const STEP_CARDS: StepCard[] = [
  {
    number: "01",
    title: "Placement Test",
    subtitle: "Entrance assessment, proficiency roadmap.",
    graphic: (
      <div className="flex flex-col items-center">
        <GaugeIcon />
        <span className="mt-2 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-[#00b4d8]">
          Assess proficiency
        </span>
      </div>
    ),
    ctaHref: "/collection",
  },
  {
    number: "02",
    title: "Live Lesson",
    subtitle: "Free online lectures from IELTS experts.",
    graphic: (
      <div className="flex flex-col items-center">
        <div className="relative h-16 w-full max-w-[160px] overflow-hidden rounded-lg bg-gradient-to-br from-sky-400 to-blue-600">
          <span className="absolute left-2 top-2 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>
          <span aria-hidden="true" className="absolute bottom-2 right-2 text-sm">
            ⭐
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
              <YouTubePlayIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
        <span className="mt-2 text-xs font-bold text-[#00b4d8]">FREE</span>
      </div>
    ),
    ctaHref: "/live-lessons",
  },
  {
    number: "03",
    title: "Intensive Course",
    subtitle: "Courses by 8.0+ IELTS instructors.",
    graphic: (
      <div className="flex flex-col items-center">
        <LightbulbIcon />
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {["Masterclass", "IELTS 1v1", "Video courses", "Guaranteed outcomes"].map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
    ctaHref: "/ielts-premium-services",
  },
  {
    number: "04",
    title: "Free IELTS Mock Test",
    // Reworded from the brief's "adheres to British Council and IDP
    // standards" — that would claim official endorsement from two real
    // organizations this project has no affiliation with. Same honest
    // phrasing pattern used in MockTestsBanner.
    subtitle: "Free collection of practice tests designed to mirror the format and difficulty of the official exam.",
    graphic: <DocumentIcon />,
  },
  {
    number: "05",
    title: "Mock Test with AI",
    subtitle: "Detailed AI evaluations on grammar, vocabulary, and coherence.",
    graphic: <SparkleIcon />,
  },
  {
    number: "06",
    title: "Unlock Full Services",
    subtitle: "Comprehensive support catalog serving all IELTS preparation needs.",
    graphic: <UnlockIcon />,
  },
];

export function SixStepsSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-8xl font-black leading-none text-[#1b2a4a]">6</span>
            <span className="mb-1 origin-bottom-left -rotate-90 whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-[#1b2a4a]/60">
              Steps
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
            to <span className="text-[#00b4d8]">Achieve Your IELTS Goal</span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_CARDS.map((card) => (
            <div key={card.number} className="flex flex-col rounded-2xl border border-blue-50 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">{card.number}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-[#1b2a4a]">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
              <div className="mt-5 flex flex-1 items-center justify-center">{card.graphic}</div>
              {card.ctaHref && <ViewAllCta href={card.ctaHref} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
