export interface Announcement {
  date: string;
  title: string;
  body: string;
}

/** Real platform updates, reworded from CHANGELOG.md into user-facing language — not fabricated news. */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    date: "2026-08-09",
    title: "IELTS Tips section is live",
    body: "Skill-by-skill exam technique for Listening, Reading, Writing, Speaking, and Grammar is now available from the navigation menu.",
  },
  {
    date: "2026-08-06",
    title: "New homepage and Exam Library design",
    body: "The homepage hero, navigation, and the full Exam Library at /collection have been rebuilt with category tabs, skill filters, search, and year-by-year test volumes.",
  },
  {
    date: "2026-08-05",
    title: "Admin analytics dashboard",
    body: "Administrators can now see registration trends, pass rates, and question-level difficulty breakdowns from the admin dashboard.",
  },
  {
    date: "2026-08-04",
    title: "Examiner grading and audit history",
    body: "Writing and Speaking submissions can now be scored by an examiner through the admin panel, with every grading action recorded in a permanent audit log.",
  },
];
