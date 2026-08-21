"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LibraryLineIcon, SupportHeadsetLineIcon } from "@/components/icons/CommonIcons";

const BADGES = [
  { label: "Library", href: "/collection", Icon: LibraryLineIcon },
  { label: "Contact Us", href: "/contact", Icon: SupportHeadsetLineIcon },
];

// Shared interaction classes for the desktop/tablet card variant — flush to
// the right viewport edge (rounded only on the left, like a tab), soft
// navy-tinted shadow, and a hover/active/focus set matching a premium
// button rather than a flat link.
const CARD_ITEM_CLASS =
  "group flex w-[86px] h-[86px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-l-[10px] rounded-r-none bg-white p-2 text-center no-underline shadow-[0_8px_20px_0_rgba(41,69,99,0.1)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_0_rgba(0,0,0,0.16)] hover:no-underline active:translate-x-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-cyan-500/35 lg:w-[118px] lg:h-[109px] lg:gap-2 lg:rounded-l-[20px] lg:px-5 lg:py-4";

/**
 * Fixed quick-access widgets — flush to the right viewport edge, sitting
 * just below the navbar. Desktop/tablet render as small premium cards;
 * below `sm` they collapse into a single FAB that expands the same two
 * options above it, since two full cards plus the scroll-to-top button
 * would crowd a narrow viewport.
 */
export function FloatingActionBadges() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <>
      {/* Tablet/desktop: always-visible cards, flush to the right edge.
          top-36/lg:top-40 (144px/160px) — comfortably below the sticky
          Navbar's full height (80px logo tier + 50px nav tier = 130px).
          The previous top-28/lg:top-32 (112px/128px) started above that
          130px line while sitting at a higher z-index (z-50 vs the
          Navbar's z-40), so this card's right-aligned "Library" link
          physically covered the navbar's own right-aligned Sign Up/Log In
          links for a 2-18px band and won every click there. */}
      <div className="fixed right-0 top-36 z-50 hidden flex-col gap-3.5 sm:flex lg:top-40">
        {BADGES.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={CARD_ITEM_CLASS}>
            <Icon className="h-6 w-6 text-gray-500 lg:h-9 lg:w-9" />
            <span className="text-[11px] font-medium tracking-wide text-gray-600 lg:text-sm">{label}</span>
          </Link>
        ))}
      </div>

      {/* Mobile: single FAB expands into the same two options */}
      <div ref={containerRef} className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2 sm:hidden">
        {mobileOpen && (
          <div className="flex flex-col items-end gap-2">
            {BADGES.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 rounded-full bg-white py-2.5 pl-4 pr-5 text-sm font-medium tracking-wide text-gray-600 no-underline shadow-[0_8px_20px_0_rgba(41,69,99,0.1)] transition-transform duration-200 ease-out hover:scale-105 hover:no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-cyan-500/35"
              >
                <Icon className="h-5 w-5 text-gray-500" />
                {label}
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close quick actions" : "Open quick actions"}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-[#294563] p-0 text-white shadow-[0_8px_20px_0_rgba(41,69,99,0.25)] transition-transform duration-200 ease-out hover:bg-[#1d3146] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-cyan-500/35 ${
            mobileOpen ? "rotate-45" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </>
  );
}
