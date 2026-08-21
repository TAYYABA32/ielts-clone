"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons/CommonIcons";
import { HeroSlideGlobalPlatform } from "./HeroSlideGlobalPlatform";
import { HeroSlidePlatinumPartner } from "./HeroSlidePlatinumPartner";
import { HeroSlideCourses } from "./HeroSlideCourses";
import { HeroSlideStudyAbroad } from "./HeroSlideStudyAbroad";

// Order matches the reference's own slide sequence.
const SLIDES = [
  { component: HeroSlideGlobalPlatform, label: "The #1 global IELTS online study platform" },
  { component: HeroSlidePlatinumPartner, label: "Proud to be Platinum Partner of the British Council and IDP" },
  { component: HeroSlideCourses, label: "Breakthrough your band score with our specialized IELTS courses" },
  { component: HeroSlideStudyAbroad, label: "Where would you like to study abroad?" },
];

const AUTOPLAY_DELAY_MS = 6000;

export function HeroCarousel() {
  // Lazy initializer so the plugin instance identity is stable across
  // renders (Embla expects the plugins array not to be recreated every
  // render) while still respecting prefers-reduced-motion at mount time.
  const [plugins] = useState(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return prefersReducedMotion
      ? []
      : [Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false, stopOnMouseEnter: true })];
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <div
      className="relative overflow-hidden bg-white"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Bright ambient background shared by every slide — soft cyan glow, no solid dark panels */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-cyan-100/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-cyan-50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-1/3 top-0 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />

      <div ref={emblaRef} className="relative overflow-hidden">
        <div className="flex">
          {SLIDES.map(({ component: Slide, label }, index) => (
            <div
              key={label}
              className="relative min-h-[560px] min-w-0 flex-[0_0_100%] sm:min-h-[540px] lg:min-h-[560px]"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${SLIDES.length}: ${label}`}
              aria-hidden={selectedIndex !== index}
            >
              <Slide />
            </div>
          ))}
        </div>
      </div>

      {/* Prev/next arrows — pinned to the banner's outer edges, vertically centered */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white p-0 text-[#00a8cc] shadow-md hover:bg-cyan-50 sm:left-6"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white p-0 text-[#00a8cc] shadow-md hover:bg-cyan-50 sm:right-6"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {/* Slide indicator dots */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.label}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex}
            onClick={() => scrollTo(index)}
            className={`h-2.5 w-2.5 rounded-full bg-transparent p-0 shadow-none transition-colors ${
              index === selectedIndex ? "bg-[#00b4d8]" : "bg-[#294563]/20 hover:bg-[#294563]/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
