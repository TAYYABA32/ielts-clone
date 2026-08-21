import { HeroButton } from "./HeroButton";
import { HeroImageCard } from "./HeroImageCard";

const DESTINATIONS = ["Study in UK", "Study in Australia", "Study in Canada", "Study in America", "Another Country"];

/** Slide 4 — matches the reference's ".global-hero -plane" study-abroad layout: heading + destination pills + consultation CTA + banner image. */
export function HeroSlideStudyAbroad() {
  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-semibold leading-[1.15] text-[#1b2a4a] sm:text-4xl lg:text-[42px]">
          Where would you like to <span className="font-extrabold text-[#00b4d8]">study abroad?</span>
        </h2>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
          {DESTINATIONS.map((label) => (
            <a
              key={label}
              href="#tests"
              className="rounded-full border border-[#BDC5CF] bg-white px-4 py-2 text-sm font-semibold text-[#294563] no-underline transition-colors hover:border-[#00b4d8] hover:bg-cyan-50 hover:no-underline"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="mt-8 flex justify-center lg:justify-start">
          <HeroButton href="/contact" variant="solid">
            Free 1-1 Consultation
          </HeroButton>
        </div>
      </div>

      <HeroImageCard src="/images/hero-airplane.jpeg" alt="An airplane taking off, representing studying abroad" />
    </div>
  );
}
