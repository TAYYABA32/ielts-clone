interface BrandMarkIconProps {
  className?: string;
}

/**
 * Original brand mark — a rounded badge with an ascending progress line
 * ending in a highlighted checkpoint dot, reading as "your path to your
 * target band score." Deliberately not a shield (a shield reads as
 * generic/certification-cliché) and not a reproduction of any real
 * platform's trademarked logo — hand-authored geometry using this site's
 * own navy/cyan palette (#1b2a4a / #00b4d8), the same colors used for the
 * navbar and every CTA/accent across the app.
 */
function BrandMarkIcon({ className }: BrandMarkIconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#1b2a4a" />
      <path
        d="M10 27 L17 20.5 L22.5 24 L29 13"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="13" r="3.25" fill="#00b4d8" />
    </svg>
  );
}

const ICON_SIZE: Record<"sm" | "md", string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const WORDMARK_SIZE: Record<"sm" | "md", string> = {
  sm: "text-sm",
  md: "text-lg",
};

interface BrandLogoProps {
  size?: "sm" | "md";
}

/** Icon + wordmark lockup — single horizontal row, no HTML-constructed graphics. */
export function BrandLogo({ size = "md" }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMarkIcon className={`${ICON_SIZE[size]} shrink-0`} />
      <span className={`font-extrabold tracking-tight text-[#1b2a4a] ${WORDMARK_SIZE[size]}`}>
        IELTS <span className="text-[#00b4d8]">Pathway</span>
      </span>
    </div>
  );
}
