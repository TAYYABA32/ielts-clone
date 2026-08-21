import { HeroImageCard } from "./HeroImageCard";

/**
 * Slide 2 — matches the reference's ".global-hero -partner" layout (heading +
 * caption + banner image, no CTA buttons on this slide). Uses this
 * project's own real, verifiable fact (IELTS is jointly owned/delivered by
 * these organizations — see SiteFooter's trademark line) but renders plain
 * text rather than any reproduction of their actual trademarked logos.
 */
export function HeroSlidePlatinumPartner() {
  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-semibold leading-[1.3] text-[#1b2a4a] sm:text-4xl lg:text-[38px]">
          Proud to be
          <br />
          <span className="font-extrabold uppercase text-[#00b4d8]">Platinum Partner</span>
          <br />
          of the <span className="font-extrabold text-[#1b2a4a]">British Council</span> and{" "}
          <span className="font-extrabold text-[#1b2a4a]">IDP</span> for many years
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#505050] lg:mx-0">
          The credibility and quality of IELTS Pathway are inspired by globally recognized standards.
        </p>
      </div>

      <HeroImageCard
        src="/images/instructor-2.jpeg"
        alt="An IELTS instructor"
        cards={[
          {
            position: "bottom-6 left-2 w-40 sm:-left-4",
            content: <p className="text-xs font-semibold leading-snug text-[#1b2a4a]">Certified &amp; Trusted Worldwide</p>,
          },
        ]}
      />
    </div>
  );
}
