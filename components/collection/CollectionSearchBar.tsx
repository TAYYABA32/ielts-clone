function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

interface CollectionSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Search input — measurements read from the reference's .search-box__input /
 * .search-box__btn CSS: 40px height, fully rounded, #BDC5CF border, 14px
 * text, and the icon sits INSIDE the input on the right (not the left).
 */
export function CollectionSearchBar({ value, onChange }: CollectionSearchBarProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        aria-label="Search mock tests"
        className="mt-0 h-10 w-full rounded-full border border-[#BDC5CF] py-[10px] pl-4 pr-10 text-sm text-[#6F6F6F] shadow-none placeholder:text-[#9AA3AE] focus:border-[#294563] focus:outline-none focus:ring-2 focus:ring-[#294563]/30 [&::-webkit-search-cancel-button]:hidden"
      />
      <SearchIcon className="pointer-events-none absolute right-[15px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#294563]" />
    </div>
  );
}
