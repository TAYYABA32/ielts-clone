import type { ModuleType, TestType } from "@/types/test";

export interface BandRange {
  minRaw: number;
  maxRaw: number;
  band: number;
}

/**
 * Commonly published approximate raw-to-band conversion tables (out of 40).
 * IELTS does not publish an official fixed table — the real conversion is
 * regenerated per test administration via equating. Swap these for the
 * official table (loaded from BandScoreConversion in the DB) once available;
 * this is the static fallback used in dev/seed data.
 */
const LISTENING_TABLE: BandRange[] = [
  { minRaw: 39, maxRaw: 40, band: 9.0 },
  { minRaw: 37, maxRaw: 38, band: 8.5 },
  { minRaw: 35, maxRaw: 36, band: 8.0 },
  { minRaw: 32, maxRaw: 34, band: 7.5 },
  { minRaw: 30, maxRaw: 31, band: 7.0 },
  { minRaw: 26, maxRaw: 29, band: 6.5 },
  { minRaw: 23, maxRaw: 25, band: 6.0 },
  { minRaw: 18, maxRaw: 22, band: 5.5 },
  { minRaw: 16, maxRaw: 17, band: 5.0 },
  { minRaw: 13, maxRaw: 15, band: 4.5 },
  { minRaw: 11, maxRaw: 12, band: 4.0 },
  { minRaw: 8, maxRaw: 10, band: 3.5 },
  { minRaw: 6, maxRaw: 7, band: 3.0 },
  { minRaw: 4, maxRaw: 5, band: 2.5 },
  { minRaw: 0, maxRaw: 3, band: 2.0 },
];

const ACADEMIC_READING_TABLE: BandRange[] = [
  { minRaw: 39, maxRaw: 40, band: 9.0 },
  { minRaw: 37, maxRaw: 38, band: 8.5 },
  { minRaw: 35, maxRaw: 36, band: 8.0 },
  { minRaw: 33, maxRaw: 34, band: 7.5 },
  { minRaw: 30, maxRaw: 32, band: 7.0 },
  { minRaw: 27, maxRaw: 29, band: 6.5 },
  { minRaw: 23, maxRaw: 26, band: 6.0 },
  { minRaw: 19, maxRaw: 22, band: 5.5 },
  { minRaw: 15, maxRaw: 18, band: 5.0 },
  { minRaw: 13, maxRaw: 14, band: 4.5 },
  { minRaw: 10, maxRaw: 12, band: 4.0 },
  { minRaw: 8, maxRaw: 9, band: 3.5 },
  { minRaw: 6, maxRaw: 7, band: 3.0 },
  { minRaw: 4, maxRaw: 5, band: 2.5 },
  { minRaw: 0, maxRaw: 3, band: 2.0 },
];

const GENERAL_READING_TABLE: BandRange[] = [
  { minRaw: 40, maxRaw: 40, band: 9.0 },
  { minRaw: 39, maxRaw: 39, band: 8.5 },
  { minRaw: 37, maxRaw: 38, band: 8.0 },
  { minRaw: 36, maxRaw: 36, band: 7.5 },
  { minRaw: 34, maxRaw: 35, band: 7.0 },
  { minRaw: 32, maxRaw: 33, band: 6.5 },
  { minRaw: 30, maxRaw: 31, band: 6.0 },
  { minRaw: 27, maxRaw: 29, band: 5.5 },
  { minRaw: 23, maxRaw: 26, band: 5.0 },
  { minRaw: 19, maxRaw: 22, band: 4.5 },
  { minRaw: 15, maxRaw: 18, band: 4.0 },
  { minRaw: 12, maxRaw: 14, band: 3.5 },
  { minRaw: 9, maxRaw: 11, band: 3.0 },
  { minRaw: 0, maxRaw: 8, band: 2.5 },
];

export function getBandTable(testType: TestType, moduleType: ModuleType): BandRange[] {
  if (moduleType === "LISTENING") return LISTENING_TABLE;
  if (moduleType === "READING") return testType === "ACADEMIC" ? ACADEMIC_READING_TABLE : GENERAL_READING_TABLE;
  throw new Error(`No static band table for module type: ${moduleType}. Writing/Speaking are examiner-scored.`);
}

export function rawToBand(rawScore: number, testType: TestType, moduleType: ModuleType): number {
  const table = getBandTable(testType, moduleType);
  const clamped = Math.max(0, Math.round(rawScore));
  const match = table.find((r) => clamped >= r.minRaw && clamped <= r.maxRaw);
  if (!match) {
    throw new Error(`Raw score ${rawScore} out of range for ${testType}/${moduleType} band table`);
  }
  return match.band;
}

/** Rounds to the nearest 0.5, rounding .25/.75 up — per IELTS overall-band rounding rules. */
export function roundToNearestHalfBand(value: number): number {
  const doubled = value * 2;
  const flooredDoubled = Math.floor(doubled);
  const remainder = doubled - flooredDoubled;
  const rounded = remainder < 0.5 ? flooredDoubled : flooredDoubled + 1;
  return rounded / 2;
}
