import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { parsePagination } from "@/lib/api/pagination";
import { UserRoleCell } from "@/components/admin/UserRoleCell";
import type { Role } from "@prisma/client";

const ROLE_FILTER_VALUES: Role[] = ["STUDENT", "CONTENT_EDITOR", "ADMIN"];

interface AdminUsersPageProps {
  searchParams: { page?: string; search?: string; role?: string };
}

function isRole(value: string | undefined): value is Role {
  return ROLE_FILTER_VALUES.includes(value as Role);
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  // ADMIN-only, not CONTENT_EDITOR — role management is more sensitive than
  // content editing (re-checked independently in the PATCH route too).
  await requireRole("ADMIN");

  const { page, pageSize, skip, take } = parsePagination(searchParams, { defaultPageSize: 20 });
  const search = searchParams.search?.trim() || undefined;
  const roleFilter = isRole(searchParams.role) ? searchParams.role : undefined;

  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(search || roleFilter);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", String(targetPage));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header>
        <h1>Users</h1>
        <p className="text-sm text-gray-500">
          {total} user{total === 1 ? "" : "s"} {hasFilters ? "matching filters" : "total"}
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="search">Search</label>
          <input id="search" name="search" defaultValue={search ?? ""} placeholder="Name or email…" />
        </div>
        <div>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue={roleFilter ?? ""}>
            <option value="">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="CONTENT_EDITOR">Content Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button type="submit">Search</button>
        {hasFilters && (
          <Link href="/admin/users" className="text-sm">
            Clear filters
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-gray-600">No users match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <UserRoleCell userId={user.id} userName={user.name} initialRole={user.role} />
                    </td>
                    <td>{user.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="flex items-center justify-between text-sm" aria-label="User list pagination">
            {page > 1 ? (
              <Link href={buildPageHref(page - 1)}>← Previous</Link>
            ) : (
              <span className="text-gray-300" aria-hidden="true">
                ← Previous
              </span>
            )}
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={buildPageHref(page + 1)}>Next →</Link>
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
