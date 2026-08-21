export interface PartnerLogoItem {
  name: string;
  /** Real logo asset path, once one exists — see the section component's comment on why none are wired up yet. */
  logoSrc?: string;
}

interface PartnerLogoMarqueeProps {
  items: PartnerLogoItem[];
  direction: "left" | "right";
  durationSeconds?: number;
}

/**
 * One continuously-scrolling row of partner logos. The item list is
 * rendered twice back-to-back (see the `marquee-left`/`marquee-right`
 * keyframes in globals.css) so the loop has no visible jump. Height is
 * constrained to ~45px, width is left to vary per logo's natural aspect
 * ratio — never stretched, never cropped. Text-fallback items render as
 * bold dark-navy wordmarks (not muted gray placeholder text) so they read
 * as confident institution marks rather than empty slots.
 */
export function PartnerLogoMarquee({ items, direction, durationSeconds = 36 }: PartnerLogoMarqueeProps) {
  const doubled = [...items, ...items];
  const animationName = direction === "left" ? "marquee-left" : "marquee-right";

  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max items-center gap-12 sm:gap-16 lg:gap-[70px]"
        style={{ animation: `${animationName} ${durationSeconds}s linear infinite` }}
      >
        {doubled.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex h-11 shrink-0 items-center sm:h-12 lg:h-[52px]">
            {item.logoSrc ? (
              // A variable-aspect-ratio logo strip needs the image's own
              // natural width at a fixed height — next/image's `fill` mode
              // forces a fixed-aspect-ratio box, which fights exactly the
              // "constrain height, let width vary" behavior this needs.
              // eslint-disable-next-line @next/next/no-img-element -- see comment above
              <img src={item.logoSrc} alt={item.name} className="h-full w-auto object-contain" />
            ) : (
              <span className="whitespace-nowrap text-2xl font-extrabold uppercase tracking-wide text-[#1E3A5F] transition-colors duration-200 hover:text-[#00B4D8] sm:text-[28px] lg:text-[32px]">
                {item.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
