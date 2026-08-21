import { requireRole } from "@/lib/auth/session";
import { getAnalyticsSummary, resolveDateRange, PASS_BAND_THRESHOLD } from "@/lib/admin/analytics";
import { StatTile } from "@/components/admin/analytics/StatTile";
import { TrendLineChart } from "@/components/admin/analytics/TrendLineChart";
import { QuestionDifficultyChart } from "@/components/admin/analytics/QuestionDifficultyChart";

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatBand(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface AdminAnalyticsPageProps {
  searchParams: { from?: string; to?: string };
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  await requireRole("ADMIN");

  const range = resolveDateRange(searchParams);
  const summary = await getAnalyticsSummary(range);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1>Analytics</h1>
        <p className="text-sm text-gray-500">
          {toDateInputValue(range.from)} – {toDateInputValue(range.to)}
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="from">From</label>
          <input id="from" type="date" name="from" defaultValue={toDateInputValue(range.from)} />
        </div>
        <div>
          <label htmlFor="to">To</label>
          <input id="to" type="date" name="to" defaultValue={toDateInputValue(range.to)} />
        </div>
        <button type="submit">Apply</button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Total users" value={summary.totalUsers.toLocaleString()} sublabel="All time" />
        <StatTile label="Active users" value={summary.activeUsers.toLocaleString()} sublabel="Started a test in range" />
        <StatTile label="New registrations" value={summary.newRegistrations.toLocaleString()} />
        <StatTile label="Test attempts" value={summary.testAttempts.toLocaleString()} />
        <StatTile label="Completion rate" value={formatPercent(summary.completionRate)} sublabel="Submitted / started" />
        <StatTile label="Average band score" value={formatBand(summary.averageBandScore)} sublabel="Submitted attempts" />
        <StatTile
          label="Pass rate"
          value={formatPercent(summary.passRate)}
          sublabel={`Band ≥ ${PASS_BAND_THRESHOLD.toFixed(1)} counts as pass (configurable assumption)`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TrendLineChart
          title="New registrations"
          data={summary.registrationTrend.map((p) => ({ date: p.date, value: p.count }))}
          valueLabel="Registrations"
        />
        <TrendLineChart
          title="Pass rate trend"
          caption={`Share of submitted attempts per day at or above band ${PASS_BAND_THRESHOLD.toFixed(1)}`}
          data={summary.passRateTrend.map((p) => ({ date: p.date, value: Math.round(p.passRate * 100) }))}
          valueLabel="Pass rate"
          formatValue={(v) => `${v}%`}
        />
      </div>

      <QuestionDifficultyChart questions={summary.hardestQuestions} />
    </div>
  );
}
