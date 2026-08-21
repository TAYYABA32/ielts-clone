"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons/CommonIcons";
import { Dropdown } from "./Dropdown";
import { DropdownItem } from "./DropdownItem";
import type { NavItemConfig } from "@/lib/navigation/navigationConfig";

// Closing on a short delay (rather than instantly on mouseleave) is what
// lets a user move the cursor diagonally from the trigger into the panel
// without it flickering shut — the classic mega-menu "hover intent" fix.
const HOVER_CLOSE_DELAY_MS = 150;

const TRIGGER_LINK_CLASS =
  "flex h-full items-center whitespace-nowrap px-[10px] text-sm font-extrabold text-white no-underline hover:bg-[#536b83] hover:no-underline";

interface NavItemProps {
  item: NavItemConfig;
}

/** One top-level nav entry — a real link plus, if it has children, a separate chevron toggle and a Dropdown panel. */
export function NavItem({ item }: NavItemProps) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const hasChildren = Boolean(item.children?.length);
  const isActive = pathname === item.href || Boolean(pathname && pathname.startsWith(`${item.href}/`));
  const dropdownId = `nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openNow = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => () => clearCloseTimeout(), []);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      containerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <li
      ref={containerRef}
      className="relative flex h-full shrink-0 items-stretch"
      onMouseEnter={hasChildren ? openNow : undefined}
      onMouseLeave={hasChildren ? scheduleClose : undefined}
    >
      <div className="flex h-full items-stretch">
        <Link href={item.href} className={`${TRIGGER_LINK_CLASS} ${isActive ? "bg-[#536b83]" : ""}`}>
          {item.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            aria-controls={dropdownId}
            aria-label={`${open ? "Collapse" : "Expand"} ${item.label} menu`}
            onClick={() => (open ? setOpen(false) : openNow())}
            className="flex h-full shrink-0 items-center bg-transparent px-1.5 text-white shadow-none hover:bg-[#536b83]"
          >
            <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {hasChildren && (
        <Dropdown open={open} id={dropdownId}>
          {item.children!.map((child) => (
            <DropdownItem key={child.href} item={child} onClick={() => setOpen(false)} />
          ))}
        </Dropdown>
      )}
    </li>
  );
}
