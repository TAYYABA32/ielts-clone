import { PartnerLogoMarquee, type PartnerLogoItem } from "./PartnerLogoMarquee";

// No real university/organization logo assets exist anywhere in this
// repository (checked public/images/ — only photos, no logo files), and
// this project has no actual partnership with any real institution.
// Reproducing real university names/logos here would misrepresent a real
// affiliation this app doesn't have, so these are original, non-existent
// institution names standing in for the visual pattern only — each item
// accepts a `logoSrc` (see PartnerLogoMarquee), so dropping in real,
// verified partner logos later needs no restructuring, just data.
const ROW_1: PartnerLogoItem[] = [
  { name: "Northbridge University" },
  { name: "Ashford College" },
  { name: "Meridian Institute" },
  { name: "Overbrook University" },
  { name: "Thorncliffe College" },
  { name: "Summit Polytechnic" },
  { name: "Oakridge University" },
  { name: "Hartley College of Business" },
];

const ROW_2: PartnerLogoItem[] = [
  { name: "Bellhaven University" },
  { name: "Kingsbridge College" },
  { name: "Silverlake Institute" },
  { name: "Northgate Business School" },
  { name: "Elmwood University" },
  { name: "Harborview College" },
  { name: "Westfield Polytechnic" },
  { name: "Ravenscourt University" },
];

/**
 * "Our Valued Partners" — a logo showcase (heading + subtitle + two
 * continuously-scrolling rows), not a card grid. Replaces the previous
 * placeholder-tile version entirely (dotted borders, graduation-cap icon,
 * "Partner Institution 1/2/3..." labels — all removed, not just restyled).
 */
export function PartnerLogosSection() {
  return (
    <section id="partners" className="scroll-mt-32 bg-white pb-16 pt-12 sm:pb-[70px] sm:pt-14">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-[32px] font-medium leading-tight text-[#1E3A5F] sm:text-4xl md:text-[48px]">
          Our <span className="text-[#00B4D8]">Valued Partners</span>
        </h2>
        <div className="mx-auto mt-3 flex max-w-xl items-center gap-3">
          <span className="h-0.5 flex-1 rounded-full bg-[#00B4D8]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-gray-500">
            IELTS Pathway is an official partner with hundreds of organizations and universities worldwide
          </p>
          <span className="h-0.5 flex-1 rounded-full bg-[#00B4D8]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
        <PartnerLogoMarquee items={ROW_1} direction="left" durationSeconds={40} />
        <PartnerLogoMarquee items={ROW_2} direction="right" durationSeconds={36} />
      </div>
    </section>
  );
}
