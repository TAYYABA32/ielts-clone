export interface TestCollectionItem {
  id: string;
  title: string;
  month: string;
  year: string;
  testType: "ACADEMIC" | "GENERAL";
  badgeColor: string;
  rating: number;
  votes: number;
  variant: "teal" | "slate";
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

const TOTAL_MONTHS = 24; // Jan 2024 -> Dec 2025

// Deterministic (no Math.random/Date.now — see WORKFLOWS.md-style guidance
// against nondeterminism in generated data) mock catalog standing in for a
// real test bank. Ratings/votes are illustrative, not real user feedback.
export const MOCK_TEST_COLLECTION: TestCollectionItem[] = Array.from({ length: TOTAL_MONTHS }, (_, i) => {
  const year = 2024 + Math.floor(i / 12);
  const month = MONTH_NAMES[i % 12]!;
  const testType: TestCollectionItem["testType"] = i % 2 === 0 ? "ACADEMIC" : "GENERAL";
  const variant: TestCollectionItem["variant"] = i % 2 === 0 ? "teal" : "slate";
  const rating = Math.round((3 + ((i * 7) % 20) / 10) * 10) / 10;
  const votes = 120 + i * 43;

  return {
    id: `${year}-${month.toLowerCase()}-${testType.toLowerCase()}`,
    title: `IELTS Mock Test ${year} ${month} (${testType === "ACADEMIC" ? "Academic" : "General Training"})`,
    month,
    year: String(year),
    testType,
    badgeColor: testType === "ACADEMIC" ? "bg-[#d97706]" : "bg-[#f43f5e]",
    rating,
    votes,
    variant,
  };
}).reverse();
