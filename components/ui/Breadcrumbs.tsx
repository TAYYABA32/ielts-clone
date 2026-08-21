import Link from "next/link";

interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}

/** Simple text breadcrumb trail — the last item (no href) renders as the current page, not a link. */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs font-medium text-gray-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-gray-300">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="text-gray-500 no-underline hover:text-[#00a8cc] hover:no-underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#1b2a4a]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
