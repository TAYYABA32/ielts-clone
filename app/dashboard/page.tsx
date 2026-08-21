import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { getAttemptStatusBadge } from "@/lib/dashboard/attemptStatus";

export default async function DashboardPage() {
  const user = await requireUser();

  const attempts = await prisma.testAttempt.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: { test: { select: { title: true, type: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header>
        <h1>My Tests</h1>
        <p className="text-sm text-gray-500">Every test attempt you&apos;ve started, in progress or completed.</p>
      </header>

      {attempts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          You haven&apos;t started a test yet.{" "}
          <Link href="/test" className="font-medium">
            Browse published tests
          </Link>{" "}
          to get going.
        </div>
      ) : (
        <ul className="space-y-3">
          {attempts.map((attempt) => {
            const badge = getAttemptStatusBadge(attempt.status);
            return (
              <li
                key={attempt.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{attempt.test.title}</p>
                  <p className="text-xs text-gray-500">
                    {attempt.test.type === "ACADEMIC" ? "Academic" : "General Training"} · Started{" "}
                    {attempt.startedAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {attempt.overallBand !== null && (
                    <span className="text-sm font-semibold text-gray-900">Band {attempt.overallBand.toFixed(1)}</span>
                  )}
                  {attempt.status === "SUBMITTED" && (
                    <Link href={`/dashboard/attempts/${attempt.id}`} className="text-sm">
                      View results
                    </Link>
                  )}
                  {attempt.status === "IN_PROGRESS" && (
                    <Link href={`/test/${attempt.testId}/start`} className="text-sm">
                      Resume
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
