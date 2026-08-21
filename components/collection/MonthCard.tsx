import Link from "next/link";
import type { Skill, VolumeMonthEntry } from "@/lib/data/testVolumes";

const SKILL_LABELS: Record<Skill, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

interface MonthCardProps {
  entry: VolumeMonthEntry;
  activeSkill: Skill | "ALL";
}

/**
 * One month's test within a CollectionVolumeCard — links to /test (this
 * app's real, authenticated "start a test" page). There's no per-month
 * test detail page, so that's the closest honest destination rather than
 * a dead "#". A `?skill=` link isn't used here since /test/page.tsx (a
 * real Prisma-backed listing) doesn't read that param — it would be a
 * link that looks skill-aware but silently does nothing. Small white
 * card, rounded, subtle shadow, hover-lift. Deliberately shows a real
 * "Start" call-to-action rather than an invented attempt count — this
 * platform has no real usage numbers to report.
 */
export function MonthCard({ entry, activeSkill }: MonthCardProps) {
  const skillLabel = activeSkill === "ALL" ? null : SKILL_LABELS[activeSkill];

  return (
    <Link
      href="/test"
      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00b4d8]/40 hover:shadow-md hover:no-underline"
    >
      <div>
        <p className="text-sm font-bold text-[#1b2a4a]">{entry.month}</p>
        <p className="text-xs text-gray-400">
          {entry.testType === "ACADEMIC" ? "Academic" : "General Training"}
          {skillLabel ? ` · ${skillLabel}` : ""}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-bold text-[#00a8cc]">
        Start
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
