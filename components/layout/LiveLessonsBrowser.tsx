"use client";

import { useSearchParams } from "next/navigation";
import { LIVE_LESSONS, type LessonSkill } from "@/lib/data/liveLessons";
import { LiveLessonCard } from "@/components/layout/LiveLessonCard";

const SKILL_FILTERS: { value: LessonSkill | "all"; label: string }[] = [
  { value: "all", label: "All Skills" },
  { value: "listening", label: "Listening" },
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "speaking", label: "Speaking" },
];

function isLessonSkill(value: string | null): value is LessonSkill {
  return value === "listening" || value === "reading" || value === "writing" || value === "speaking";
}

/** Full lesson schedule, filterable by skill via ?skill= (the Navbar's Live Lessons dropdown links here). */
export function LiveLessonsBrowser() {
  const searchParams = useSearchParams();
  const activeSkill = isLessonSkill(searchParams.get("skill")) ? (searchParams.get("skill") as LessonSkill) : "all";

  const visibleLessons = activeSkill === "all" ? LIVE_LESSONS : LIVE_LESSONS.filter((lesson) => lesson.skill === activeSkill);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {SKILL_FILTERS.map((filter) => (
          <a
            key={filter.value}
            href={filter.value === "all" ? "/live-lessons" : `/live-lessons?skill=${filter.value}`}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold no-underline hover:no-underline ${
              activeSkill === filter.value ? "bg-[#1b2a4a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      {visibleLessons.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-base font-bold text-[#1b2a4a]">No lessons scheduled for this skill yet</p>
          <p className="mt-2 text-sm text-gray-500">Check back soon, or browse all live lessons.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleLessons.map((lesson) => (
            <LiveLessonCard key={lesson.skill} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
