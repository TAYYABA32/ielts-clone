export type Skill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
export type TestType = "ACADEMIC" | "GENERAL";

export interface VolumeMonthEntry {
  id: string;
  month: string;
  year: string;
  testType: TestType;
  attemptsBySkill: Record<Skill, number>;
  totalAttempts: number;
}

export interface TestVolume {
  year: string;
  variant: "teal" | "slate";
  months: VolumeMonthEntry[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Newest first, matching how a real exam library would list volumes.
const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

// Rough, roughly-even split of a month's total attempts across the four
// skills — illustrative, not real usage data.
const SKILL_SHARE: Record<Skill, number> = {
  LISTENING: 0.27,
  READING: 0.26,
  WRITING: 0.24,
  SPEAKING: 0.23,
};

// Deterministic (no Math.random/Date.now) pseudo-varied values used only
// as an internal, never-displayed ranking key for the "Most Popular" sort
// option (CollectionBrowser) — not shown to users as a claimed attempt
// count, since this platform has no real usage numbers to report.
function totalAttemptsFor(seed: number): number {
  return 900_000 + ((seed * 15731) % 4_600_000);
}

export const TEST_VOLUMES: TestVolume[] = YEARS.map((year, yearIndex) => ({
  year,
  variant: yearIndex % 2 === 0 ? "teal" : "slate",
  months: MONTH_NAMES.map((month, monthIndex) => {
    const globalIndex = yearIndex * 12 + monthIndex;
    const testType: TestType = globalIndex % 2 === 0 ? "ACADEMIC" : "GENERAL";
    const totalAttempts = totalAttemptsFor(globalIndex);

    return {
      id: `${year}-${month.toLowerCase()}`,
      month,
      year,
      testType,
      attemptsBySkill: {
        LISTENING: Math.round(totalAttempts * SKILL_SHARE.LISTENING),
        READING: Math.round(totalAttempts * SKILL_SHARE.READING),
        WRITING: Math.round(totalAttempts * SKILL_SHARE.WRITING),
        SPEAKING: Math.round(totalAttempts * SKILL_SHARE.SPEAKING),
      },
      totalAttempts,
    };
  }),
}));
