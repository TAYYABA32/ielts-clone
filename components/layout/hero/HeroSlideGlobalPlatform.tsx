import { HeroButton } from "./HeroButton";
import { HeroImageCard } from "./HeroImageCard";

/** Primary hero slide — bright theme, matching the reference's ".global-hero -platform" layout/typography. */
export function HeroSlideGlobalPlatform() {
  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <h1 className="text-3xl font-semibold leading-[1.15] text-[#1b2a4a] sm:text-4xl lg:text-[42px]">
          THE <span className="font-extrabold uppercase text-[#00b4d8]">#1 Global</span>
          <br className="hidden sm:block" /> IELTS Online Study Platform
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#505050] lg:mx-0">
          Achieve your dream band score with just one click!
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
          <HeroButton href="/contact" variant="outline">
            Contact Us
          </HeroButton>
          <HeroButton href="/collection" variant="solid">
            Start Now
          </HeroButton>
        </div>
      </div>

      <HeroImageCard
        src="/images/instructor-1.jpeg"
        alt="A student preparing for the IELTS exam"
        cards={[
          {
            position: "left-2 top-4 w-40 sm:left-0",
            content: (
              <p className="text-xs font-semibold leading-snug text-[#1b2a4a]">
                Take a <strong>Free Online Test</strong>, get your <strong>Score The Best!</strong>
              </p>
            ),
          },
          {
            position: "bottom-6 right-2 w-36 sm:-right-4",
            content: (
              <>
                <p className="text-lg font-extrabold leading-tight text-[#1b2a4a]">Instant Scoring</p>
                <p className="mt-1 text-xs font-medium text-[#1b2a4a]/80">on every mock test</p>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
