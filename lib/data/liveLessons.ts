export type LessonSkill = "listening" | "reading" | "writing" | "speaking";

interface SkillTheme {
  /** The ribbon-tag gradient (top of card) — exact stops read from the reference's .lesson-item__type CSS. */
  tagGradient: string;
  /** The avatar ring + hover-glow color — from .lesson-item__avatar-wrap. */
  avatarRing: string;
  /** The pale pill background behind the "ENG" language tag — from .lesson-item__language. */
  languageBg: string;
}

export const SKILL_THEME: Record<LessonSkill, SkillTheme> = {
  reading: { tagGradient: "from-[#337845] to-[#337845]", avatarRing: "#37854D", languageBg: "#D6E4DA" },
  writing: { tagGradient: "from-[#FAA859] to-[#FF9836]", avatarRing: "#F9A95A", languageBg: "#FEEEDE" },
  speaking: { tagGradient: "from-[#C86478] to-[#D95670]", avatarRing: "#C76378", languageBg: "#F4E0E4" },
  listening: { tagGradient: "from-[#33B2C7] to-[#41A8B8]", avatarRing: "#32B4C8", languageBg: "#D6F0F4" },
};

export interface LiveLesson {
  skill: LessonSkill;
  tag: string;
  photo: string;
  /** Small circular instructor avatar — a real local photo, independent of `photo`. */
  avatarPhoto: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  attending: string;
}

// Specific near-future calendar dates on a REGISTER button would otherwise
// read as a real scheduled event, so these stay generic ("Every Tuesday")
// rather than a dated event this demo can't actually run. Instructor names
// are original/fictional and the organization is this project's own brand
// — NOT the reference site's real instructor names or its real operating
// company, which would misattribute a real person's identity or a real
// company's affiliation to this unrelated project.
//
// Order matters: LiveLessonsSection (homepage teaser) shows the first 3 —
// Reading, Writing, Listening. Speaking is 4th, still reachable on the
// full /live-lessons hub page.
export const LIVE_LESSONS: LiveLesson[] = [
  {
    skill: "reading",
    tag: "Reading",
    photo: "/images/lesson-reading.jpeg",
    avatarPhoto: "/images/lesson-reading.jpeg",
    title: "Reading - True, False, Not Given Questions",
    instructor: "Ms. Claire B.",
    date: "Every Tuesday",
    time: "08:00 - 09:00",
    attending: "950+",
  },
  {
    skill: "writing",
    tag: "Writing",
    photo: "/images/lesson-writing.jpeg",
    avatarPhoto: "/images/lesson-writing.jpeg",
    title: "Academic Writing Task 2 - Agree & Disagree Essays: The Environment",
    instructor: "Mr. Daniel H.",
    date: "Every Wednesday",
    time: "08:00 - 09:00",
    attending: "400+",
  },
  {
    skill: "listening",
    tag: "Listening",
    photo: "/images/lesson-listening.jpeg",
    avatarPhoto: "/images/instructor-2.jpeg",
    title: "IELTS Listening Part 3 & 4",
    instructor: "Ms. Priya N.",
    date: "Every Thursday",
    time: "08:00 - 09:00",
    attending: "500+",
  },
  {
    skill: "speaking",
    tag: "Speaking",
    photo: "/images/instructor-1.jpeg",
    avatarPhoto: "/images/instructor-1.jpeg",
    title: "Speaking - Planning your Part 2 Talk",
    instructor: "Ms. Amara O.",
    date: "Every Friday",
    time: "08:00 - 09:00",
    attending: "600+",
  },
];
