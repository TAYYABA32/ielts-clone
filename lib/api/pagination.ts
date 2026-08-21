export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

type SearchParamsLike = URLSearchParams | Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParamsLike, key: string): string | undefined {
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parses & clamps `?page`/`?pageSize` the same way everywhere they're
 * accepted — page >= 1, 1 <= pageSize <= maxPageSize, non-numeric input
 * falls back to the default rather than producing NaN. Shared by admin API
 * routes (URLSearchParams) and admin pages (the plain searchParams object
 * Next.js passes to Server Components) so the two can't drift.
 */
export function parsePagination(
  searchParams: SearchParamsLike,
  { defaultPageSize = 20, maxPageSize = 100 }: { defaultPageSize?: number; maxPageSize?: number } = {}
): PaginationParams {
  const rawPage = Number(getParam(searchParams, "page"));
  const rawPageSize = Number(getParam(searchParams, "pageSize"));

  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number.isFinite(rawPageSize) ? rawPageSize : defaultPageSize));

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
