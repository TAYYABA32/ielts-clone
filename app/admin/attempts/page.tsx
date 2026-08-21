import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { parsePagination } from "@/lib/api/pagination";

function needsGrading(moduleAttempts: { bandScore: number | null; module: { type: string } }[]): boolean {
  return moduleAttempts.some((ma) => (ma.module.type === "WRITING" || ma.module.type === "SPEAKING") && ma.bandScore === null);
}

interface AdminAttemptsPageProps {
  searchParams: { page?: string };
}

export default async function AdminAttemptsPage({ searchParams }: AdminAttemptsPageProps) {
  await requireAdmin();

  // Previously a hard-coded `take: 50` with no way to see anything past the
  // 50 most recent attempts — matches the pagination pattern already used
  // by admin/tests and admin/users instead (PERFORMANCE_REPORT.md).
  const { page, pageSize, skip, take } = parsePagination(searchParams, { defaultPageSize: 50 });

  const [attempts, total] = await Promise.all([
    prisma.testAttempt.findMany({
      orderBy: { startedAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { name: true, email: true } },
        test: { select: { title: true } },
        moduleAttempts: { include: { module: { select: { type: true } } } },
      },
    }),
    prisma.testAttempt.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="ielts-admin-attempts" data-testid="admin-attempts-page">
      <h1>Test Attempts</h1>
      <p className="text-sm text-gray-500">{total} attempt{total === 1 ? "" : "s"} total</p>
      <table className="ielts-admin-attempts__table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Test</th>
            <th>Status</th>
            <th>Overall Band</th>
            <th>Grading</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id}>
              <td>
                {attempt.user.name} ({attempt.user.email})
              </td>
              <td>{attempt.test.title}</td>
              <td>{attempt.status}</td>
              <td>{attempt.overallBand !== null ? attempt.overallBand.toFixed(1) : "—"}</td>
              <td>{needsGrading(attempt.moduleAttempts) ? "Pending" : "Up to date"}</td>
              <td>
                <Link href={`/admin/attempts/${attempt.id}/grade`}>Grade</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Attempts pagination">
        {page > 1 ? (
          <Link href={`/admin/attempts?page=${page - 1}`}>← Previous</Link>
        ) : (
          <span className="text-gray-300" aria-hidden="true">
            ← Previous
          </span>
        )}
        <span className="text-gray-500">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={`/admin/attempts?page=${page + 1}`}>Next →</Link>
        ) : (
          <span className="text-gray-300" aria-hidden="true">
            Next →
          </span>
        )}
      </nav>
    </div>
  );
}
