interface HeroButtonProps {
  href: string;
  children: string;
  variant: "solid" | "outline";
}

/**
 * Shared pill CTA with a circular arrow badge — the reference's
 * ".iot-grbt" button pattern (pill, uppercase label, trailing round arrow
 * badge, glow-on-hover), reproduced with this project's own navy/cyan
 * palette rather than copying any of its markup or assets.
 */
export function HeroButton({ href, children, variant }: HeroButtonProps) {
  const isSolid = variant === "solid";
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-4 rounded-full py-1 pl-6 pr-1 text-sm font-bold uppercase tracking-wide no-underline transition-all duration-200 hover:no-underline ${
        isSolid
          ? "bg-[#294563] text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#294563]/30"
          : "border-2 border-[#00b4d8] bg-white text-[#294563] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00b4d8]/25"
      }`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
          isSolid ? "bg-[#00b4d8] text-white" : "bg-[#294563] text-white"
        }`}
      >
        ↗
      </span>
    </a>
  );
}
