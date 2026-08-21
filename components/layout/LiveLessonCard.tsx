import Image from "next/image";
import Link from "next/link";
import { SKILL_THEME, type LiveLesson } from "@/lib/data/liveLessons";

// Per-lesson focal point for the main card photo — most images can use the
// default center crop, but a portrait/landscape photo where the subject
// isn't centered needs a custom focal point so `object-cover` doesn't crop
// their face out of frame. Values are computed from each source image's
// real dimensions (not guessed): in a wide ~2:1 card only ~28-36% of a
// tall portrait's height is ever visible at once, so the offset has to be
// chosen deliberately for where the subject actually sits.
const IMAGE_POSITION: Partial<Record<LiveLesson["skill"], string>> = {
  // Source is 300x421 (portrait) shot from behind/above — her face is
  // hidden by the book and her hair by design, no crop can reveal it.
  // This keeps the open book and her hands (the only clearly legible
  // "reading" content) in frame instead of the shoe at the very top.
  reading: "object-[center_28%]",
  // Source is 736x1308 — a very tall portrait. Her face sits around
  // 44-60% down the image; the laptop is much further down (~68-92%) and
  // the two can't both fit in a ~28%-tall visible window at once. This
  // prioritizes her face (was previously cropped to hair-only at 30%,
  // which only reached the very top of her head).
  writing: "object-[center_52%]",
  // The source photo is a square classroom shot with a decorative badge
  // in the very top-left corner and a caption band along the very bottom;
  // this focal point keeps the crop on the student (headphones/notebook)
  // in the middle of the frame rather than either edge.
  listening: "object-[center_42%]",
  // Default center crop was landing on the neck/shoulders with the face
  // cut off above the card's top edge — shifting the focal point up
  // brings the face into frame.
  speaking: "object-[center_30%]",
};

/**
 * One live-lesson card. Structure, proportions, and colors read from the
 * reference site's actual ".lesson-item" CSS (image height, rounded card,
 * a ribbon-style skill tag overlapping the image's top edge, a 60px
 * circular avatar with a skill-tinted ring, and a 3-column date/time/
 * attending metadata row) — reused by the homepage teaser and the full
 * /live-lessons hub.
 */
export function LiveLessonCard({ lesson }: { lesson: LiveLesson }) {
  const theme = SKILL_THEME[lesson.skill];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_8px_20px_0_rgba(41,69,99,0.1)]">
      <div className="relative h-[200px] w-full overflow-hidden rounded-t-[20px]">
        <Image
          src={lesson.photo}
          alt=""
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className={`h-full w-full object-cover ${IMAGE_POSITION[lesson.skill] ?? "object-center"}`}
        />

        {/* Ribbon tag — overlaps the image's top edge, rounded only at the bottom, matching the reference exactly */}
        <span
          className={`absolute left-8 top-0 -translate-y-1.5 rounded-b-2xl bg-gradient-to-b px-3 py-2 pb-3 text-sm font-bold leading-none text-white ${theme.tagGradient}`}
        >
          {lesson.tag}
        </span>

        {/* "Free" badge, top-right */}
        <span className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[11px] font-black uppercase text-[#FF850F] shadow-md">
          Free
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-4">
        <p className="flex-1 text-lg font-normal leading-snug text-[#1b2a4a]">{lesson.title}</p>

        <div className="flex items-center justify-between gap-3 border-t border-[#EAECEF] pt-3">
          <div className="flex items-center gap-3">
            <span
              className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full border"
              style={{ borderColor: theme.avatarRing }}
            >
              <Image src={lesson.avatarPhoto} alt={lesson.instructor} fill sizes="60px" className="h-full w-full rounded-full object-cover" />
            </span>
            <div>
              <p className="text-base font-normal text-[#294563]">{lesson.instructor}</p>
              <p className="text-sm text-[#9A9A9A]">IELTS Pathway</p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-2 text-[13px] font-bold text-[#294563]"
            style={{ backgroundColor: theme.languageBg }}
          >
            ENG
          </span>
        </div>

        <div className="flex items-start justify-between border-t border-[#EAECEF] pt-3 text-center">
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-[#294563]">{lesson.date}</p>
            <p className="text-[11px] text-[#9A9A9A]">date</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-[#294563]">{lesson.time}</p>
            <p className="text-[11px] text-[#9A9A9A]">(GMT -4)</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-[#294563]">{lesson.attending}</p>
            <p className="text-[11px] text-[#9A9A9A]">attending</p>
          </div>
        </div>

        <Link
          href={`/live-lessons?skill=${lesson.skill}`}
          className={`mt-auto flex h-10 w-full items-center justify-center rounded-full bg-gradient-to-b text-sm font-bold uppercase tracking-wide text-white no-underline hover:no-underline ${theme.tagGradient}`}
        >
          Register
        </Link>
      </div>
    </div>
  );
}
