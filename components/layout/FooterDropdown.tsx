"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons/CommonIcons";

interface FooterDropdownProps {
  options: string[];
}

/**
 * Custom popover dropdown — deliberately not a native <select>, which
 * renders as the OS's own dropdown widget (can't be styled as a floating
 * white menu with matching borders/typography across browsers). Opens
 * upward since the trigger sits near the bottom of the page.
 */
export function FooterDropdown({ options }: FooterDropdownProps) {
  const [selected, setSelected] = useState(options[0]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-36">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-36 items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-gray-300 hover:bg-white"
      >
        <span className="truncate">{selected}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-50 mb-1 max-h-60 w-36 overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-xl"
        >
          {options.map((option) => {
            const isSelected = option === selected;
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className={`block w-full cursor-pointer rounded-none px-3 py-1.5 text-left text-sm font-bold text-slate-800 shadow-none hover:bg-gray-100 ${
                    isSelected ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
