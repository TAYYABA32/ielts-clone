import Image from "next/image";
import type { ReactNode } from "react";

interface FloatingCard {
  content: ReactNode;
  position: string;
}

interface HeroImageCardProps {
  src: string;
  alt: string;
  cards?: FloatingCard[];
}

/**
 * Large rounded hero banner image with optional floating glassmorphism
 * cards overlaid — matches the reference's ".hero-banner__img" (real
 * photo, border-radius 40px) + ".hero-banner__text-card" (frosted-glass
 * stat callouts) pattern, using this project's own local photos.
 */
export function HeroImageCard({ src, alt, cards = [] }: HeroImageCardProps) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] shadow-xl sm:aspect-[3/4]">
        <Image src={src} alt={alt} fill sizes="(min-width: 640px) 420px, 100vw" className="object-cover" priority />
      </div>

      {cards.map((card, index) => (
        <div
          key={index}
          className={`absolute rounded-2xl border border-white/70 bg-white/25 p-4 text-center shadow-lg backdrop-blur-md ${card.position}`}
        >
          {card.content}
        </div>
      ))}
    </div>
  );
}
