import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { parsePagination } from "@/lib/api/pagination";
import { createTest } from "./actions";

export default async function AdminTestsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin();

  const { page, pageSize, skip, take } = parsePagination(searchParams);

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { _count: { select: { modules: true, testAttempts: true } } },
    }),
    prisma.test.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1>Tests</h1>
        <p className="text-sm text-gray-500">
          {total} test{total === 1 ? "" : "s"} total
        </p>
      </header>

      <form
        action={createTest}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="title">New test title</label>
          <input id="title" name="title" required placeholder="e.g. Cambridge IELTS 18 — Test 1" />
        </div>
        <div>
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue="ACADEMIC">
            <option value="ACADEMIC">Academic</option>
            <option value="GENERAL">General Training</option>
          </select>
        </div>
        <button type="submit">Create test</button>
      </form>

      {tests.length === 0 ? (
        <p className="text-sm text-gray-600">No tests yet — create one above.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Modules</th>
                  <th>Attempts</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.title}</td>
                    <td>{test.type === "ACADEMIC" ? "Academic" : "General Training"}</td>
                    <td>{test.isPublished ? "Published" : "Draft"}</td>
                    <td>{test._count.modules}</td>
                    <td>{test._count.testAttempts}</td>
                    <td>
                      <Link href={`/admin/tests/${test.id}`}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="flex items-center justify-between text-sm" aria-label="Test list pagination">
            {page > 1 ? (
              <Link href={`/admin/tests?page=${page - 1}`}>← Previous</Link>
            ) : (
              <span className="text-gray-300" aria-hidden="true">
                ← Previous
              </span>
            )}
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={`/admin/tests?page=${page + 1}`}>Next →</Link>
            ) : (
              <span className="text-gray-300" aria-hidden="true">
                Next →
              </span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
