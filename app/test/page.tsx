import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { CANDIDATE_MODULE_SEQUENCE, getModuleTypeLabel } from "@/lib/testSequence";

/**
 * GET /test — lists published tests a student can start or resume. Read
 * directly from Prisma (no API route) since nothing else currently consumes
 * this data over HTTP; see PRODUCT_ROADMAP.md M1.2 for the alternatives
 * considered. Not paginated: fine at the current/expected test-bank size,
 * revisit (same `take`/`skip` pattern as GET /api/admin/tests) if the
 * published-test count grows into the hundreds.
 */
export default async function BrowseTestsPage() {
  const user = await requireUser();

  const tests = await prisma.test.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { modules: { select: { type: true } } },
  });

  const latestAttempts = await prisma.testAttempt.findMany({
    where: { userId: user.id, testId: { in: tests.map((t) => t.id) } },
    orderBy: { startedAt: "desc" },
  });
  const latestAttemptByTest = new Map<string, (typeof latestAttempts)[number]>();
  for (const attempt of latestAttempts) {
    if (!latestAttemptByTest.has(attempt.testId)) latestAttemptByTest.set(attempt.testId, attempt);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header>
        <h1>Browse Tests</h1>
        <p className="text-sm text-gray-500">Pick a published IELTS test to start or resume.</p>
      </header>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          No published tests are available yet — check back soon.
        </div>
      ) : (
        <ul className="space-y-3">
          {tests.map((test) => {
            const attempt = latestAttemptByTest.get(test.id);
            const configuredTypes = new Set(test.modules.map((m) => m.type));
            const moduleLabels = CANDIDATE_MODULE_SEQUENCE.filter((t) => configuredTypes.has(t)).map(getModuleTypeLabel);

            return (
              <li
                key={test.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{test.title}</p>
                  <p className="text-xs text-gray-500">
                    {test.type === "ACADEMIC" ? "Academic" : "General Training"}
                    {moduleLabels.length > 0 && ` · ${moduleLabels.join(", ")}`}
                  </p>
                  {attempt?.status === "SUBMITTED" && (
                    <p className="text-xs text-gray-500">
                      Completed — Band {attempt.overallBand !== null ? attempt.overallBand.toFixed(1) : "Pending"}
                    </p>
                  )}
                  {attempt?.status === "IN_PROGRESS" && <p className="text-xs text-gray-500">In progress</p>}
                </div>

                <Link
                  href={`/test/${test.id}/start`}
                  className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  {attempt?.status === "IN_PROGRESS" ? "Resume" : attempt?.status === "SUBMITTED" ? "Retake" : "Start"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
