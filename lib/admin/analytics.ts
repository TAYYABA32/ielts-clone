import { prisma } from "@/lib/prisma";

/**
 * IELTS has no universal pass/fail threshold — band score cutoffs are set
 * per institution/purpose. This is a configurable assumption for the
 * "pass rate" metric, surfaced in the UI rather than hidden, not an
 * authoritative IELTS rule.
 */
export const PASS_BAND_THRESHOLD = 6.0;

const MIN_QUESTION_SAMPLE_SIZE = 5;
const HARDEST_QUESTIONS_LIMIT = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DateRange {
  from: Date;
  to: Date;
}

/** Parses ?from/?to (YYYY-MM-DD), defaulting to the last 30 days; falls back to the default on invalid/missing input rather than throwing. */
export function resolveDateRange(searchParams: { from?: string; to?: string }): DateRange {
  const now = new Date();
  const parsedTo = searchParams.to ? new Date(searchParams.to) : now;
  const to = Number.isNaN(parsedTo.getTime()) ? now : parsedTo;

  const defaultFrom = new Date(to.getTime() - 30 * DAY_MS);
  const parsedFrom = searchParams.from ? new Date(searchParams.from) : defaultFrom;
  const from = Number.isNaN(parsedFrom.getTime()) ? defaultFrom : parsedFrom;

  return { from, to };
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface PassRateTrendPoint {
  date: string;
  passRate: number;
  total: number;
}

export interface HardestQuestion {
  questionId: string;
  correctRate: number;
  sampleSize: number;
  prompt: string | null;
  moduleType: string;
  testTitle: string;
}

export interface AnalyticsSummary {
  totalUsers: number;
  newRegistrations: number;
  activeUsers: number;
  testAttempts: number;
  completionRate: number;
  averageBandScore: number | null;
  passRate: number | null;
  registrationTrend: TrendPoint[];
  passRateTrend: PassRateTrendPoint[];
  hardestQuestions: HardestQuestion[];
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bucketByDay(dates: Date[]): TrendPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = toDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function bucketPassRateByDay(attempts: Array<{ submittedAt: Date | null; overallBand: number | null }>): PassRateTrendPoint[] {
  const buckets = new Map<string, { pass: number; total: number }>();
  for (const attempt of attempts) {
    if (!attempt.submittedAt || attempt.overallBand === null) continue;
    const key = toDayKey(attempt.submittedAt);
    const bucket = buckets.get(key) ?? { pass: 0, total: 0 };
    bucket.total += 1;
    if (attempt.overallBand >= PASS_BAND_THRESHOLD) bucket.pass += 1;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { pass, total }]) => ({ date, passRate: total > 0 ? pass / total : 0, total }));
}

/**
 * Question-difficulty ranking: two DB-level groupBy aggregates (total
 * responses per question, correct responses per question) joined in memory
 * — the join set is bounded by distinct question count, not response count,
 * so this stays cheap regardless of how many responses exist. Excludes
 * questions with fewer than MIN_QUESTION_SAMPLE_SIZE responses in range to
 * avoid a single unlucky/lucky answer reading as 0%/100% "difficulty."
 */
async function getHardestQuestions(from: Date, to: Date): Promise<HardestQuestion[]> {
  const [totalByQuestion, correctByQuestion] = await Promise.all([
    prisma.questionResponse.groupBy({
      by: ["questionId"],
      where: { answeredAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.questionResponse.groupBy({
      by: ["questionId"],
      where: { answeredAt: { gte: from, lte: to }, isCorrect: true },
      _count: { _all: true },
    }),
  ]);

  const correctCountByQuestion = new Map(correctByQuestion.map((row) => [row.questionId, row._count._all]));

  const ranked = totalByQuestion
    .map((row) => ({
      questionId: row.questionId,
      sampleSize: row._count._all,
      correctRate: (correctCountByQuestion.get(row.questionId) ?? 0) / row._count._all,
    }))
    .filter((row) => row.sampleSize >= MIN_QUESTION_SAMPLE_SIZE)
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, HARDEST_QUESTIONS_LIMIT);

  if (ranked.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: { id: { in: ranked.map((row) => row.questionId) } },
    select: {
      id: true,
      prompt: true,
      group: {
        select: {
          instructions: true,
          module: { select: { type: true, test: { select: { title: true } } } },
        },
      },
    },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  return ranked.map((row) => {
    const question = questionById.get(row.questionId);
    return {
      questionId: row.questionId,
      correctRate: row.correctRate,
      sampleSize: row.sampleSize,
      prompt: question?.prompt ?? question?.group.instructions ?? null,
      moduleType: question?.group.module.type ?? "UNKNOWN",
      testTitle: question?.group.module.test.title ?? "Unknown test",
    };
  });
}

/**
 * All metrics are scoped to the given date range except `totalUsers`, which
 * is a lifetime count (there's no "un-registering") — every other figure
 * answers "in this window."
 */
export async function getAnalyticsSummary({ from, to }: DateRange): Promise<AnalyticsSummary> {
  const [
    totalUsers,
    newRegistrations,
    activeUserRows,
    testAttempts,
    submittedAttempts,
    bandAggregate,
    submittedWithBand,
    registrations,
    hardestQuestions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.testAttempt.findMany({
      where: { startedAt: { gte: from, lte: to } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.testAttempt.count({ where: { startedAt: { gte: from, lte: to } } }),
    prisma.testAttempt.count({ where: { startedAt: { gte: from, lte: to }, status: "SUBMITTED" } }),
    prisma.testAttempt.aggregate({
      where: { status: "SUBMITTED", submittedAt: { gte: from, lte: to }, overallBand: { not: null } },
      _avg: { overallBand: true },
    }),
    prisma.testAttempt.findMany({
      where: { status: "SUBMITTED", submittedAt: { gte: from, lte: to }, overallBand: { not: null } },
      select: { submittedAt: true, overallBand: true },
    }),
    prisma.user.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    getHardestQuestions(from, to),
  ]);

  const completionRate = testAttempts > 0 ? submittedAttempts / testAttempts : 0;
  const passCount = submittedWithBand.filter((a) => (a.overallBand ?? 0) >= PASS_BAND_THRESHOLD).length;
  const passRate = submittedWithBand.length > 0 ? passCount / submittedWithBand.length : null;

  return {
    totalUsers,
    newRegistrations,
    activeUsers: activeUserRows.length,
    testAttempts,
    completionRate,
    averageBandScore: bandAggregate._avg.overallBand,
    passRate,
    registrationTrend: bucketByDay(registrations.map((r) => r.createdAt)),
    passRateTrend: bucketPassRateByDay(submittedWithBand),
    hardestQuestions,
  };
}
