import Link from "next/link";
import type { NavChildItem } from "@/lib/navigation/navigationConfig";

interface DropdownItemProps {
  item: NavChildItem;
  onClick?: () => void;
}

/** One link row inside a Dropdown panel. */
export function DropdownItem({ item, onClick }: DropdownItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      role="menuitem"
      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#294563] no-underline transition-colors duration-150 hover:bg-cyan-50 hover:text-[#00a8cc] hover:no-underline focus-visible:bg-cyan-50 focus-visible:outline-none"
    >
      {item.label}
    </Link>
  );
}
