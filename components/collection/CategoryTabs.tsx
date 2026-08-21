import type { TestType } from "@/lib/data/testVolumes";

export type CategoryFilter = "ALL" | TestType;

function AllTestsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="15" width="7" height="5" rx="1.5" />
      <rect x="14" y="15" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function AcademicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
    </svg>
  );
}

function GeneralIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
    </svg>
  );
}

const CATEGORY_TABS: { value: CategoryFilter; label: string; Icon: (props: { className?: string }) => JSX.Element }[] = [
  { value: "ALL", label: "All Tests", Icon: AllTestsIcon },
  { value: "ACADEMIC", label: "Academic Test", Icon: AcademicIcon },
  { value: "GENERAL", label: "General Training Test", Icon: GeneralIcon },
];

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

/**
 * Category tab bar. Active/hover states set both background AND text/icon
 * color explicitly (rather than relying on the sitewide `button` base style
 * in globals.css, which defaults to a dark brand-600/700 hover background)
 * so a hovered or active tab never ends up with dark text on a dark
 * background.
 */
export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div role="tablist" aria-label="Test category" className="mb-8 flex gap-2 overflow-x-auto border-b border-[#EAECEF] pb-3">
      {CATEGORY_TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex shrink-0 items-center whitespace-nowrap rounded-full px-[15px] py-[15px] text-base transition-colors duration-200 sm:px-[30px] sm:text-lg ${
              isActive
                ? "bg-[#1E3A5F] font-semibold text-white shadow-sm hover:bg-[#1E3A5F]"
                : "bg-transparent font-medium text-[#546A82] hover:bg-slate-100 hover:text-[#1E3A5F]"
            }`}
          >
            <tab.Icon className="mr-2.5 h-5 w-5 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
