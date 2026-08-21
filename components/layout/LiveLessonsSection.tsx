import Link from "next/link";
import { LIVE_LESSONS } from "@/lib/data/liveLessons";
import { LiveLessonCard } from "./LiveLessonCard";

export function LiveLessonsSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
          Join Our <span className="text-[#00a8cc]">Live Lessons</span>
          <br />
          with <span className="text-[#00a8cc]">Industry Experts</span>
        </h2>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-3">
          <span className="h-px flex-1 bg-[#00a8cc]/40" aria-hidden="true" />
          <p className="text-sm text-gray-500">
            Build your confidence in all IELTS skills and prepare for studying abroad with our daily webinars
          </p>
          <span className="h-px flex-1 bg-[#00a8cc]/40" aria-hidden="true" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          {LIVE_LESSONS.slice(0, 3).map((lesson) => (
            <LiveLessonCard key={lesson.skill} lesson={lesson} />
          ))}
        </div>

        <Link
          href="/live-lessons"
          className="mx-auto mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#1e293b] px-6 py-3 font-bold text-white no-underline shadow-lg hover:bg-[#0f172a] hover:no-underline"
        >
          EXPLORE MORE
          <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
            ↗
          </span>
        </Link>
      </div>
    </section>
  );
}
