import type { Skill } from "@/lib/data/testVolumes";

export type SkillFilter = "ALL" | Skill;

function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 16 0v4" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 4.5 3 3L7 20H4v-3L16.5 4.5Z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

const SKILL_TABS: {
  value: SkillFilter;
  label: string;
  Icon: (props: { className?: string }) => JSX.Element;
}[] = [
  { value: "ALL", label: "All Skills", Icon: GridIcon },
  { value: "LISTENING", label: "Listening", Icon: HeadphonesIcon },
  { value: "READING", label: "Reading", Icon: BookIcon },
  { value: "WRITING", label: "Writing", Icon: PencilIcon },
  { value: "SPEAKING", label: "Speaking", Icon: MicIcon },
];

interface SkillTabsProps {
  value: SkillFilter;
  onChange: (value: SkillFilter) => void;
}

/**
 * Skill pill filter — one uniform brand-cyan active state (rather than a
 * per-skill accent color) so it stays consistent with the site's core
 * palette. Both active and hover explicitly set background/text/border
 * (including on an already-active pill's hover) so the sitewide `button`
 * base style in globals.css — which defaults to a dark brand-600/700 hover
 * background — never leaks through and collides with dark text.
 */
export function SkillTabs({ value, onChange }: SkillTabsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-4">
      {SKILL_TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-6 py-[0.9rem] text-base transition-all duration-200 ${
              isActive
                ? "border-transparent bg-[#00B4D8] font-semibold text-white shadow-md hover:bg-[#00B4D8]"
                : "border-slate-300 bg-white text-slate-600 hover:border-[#00B4D8] hover:text-[#00B4D8]"
            }`}
          >
            <tab.Icon className="h-5 w-5 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
