import Link from "next/link";
import { FacebookCircleIcon, YouTubePlayIcon } from "@/components/icons/CommonIcons";
import { CURRENCIES } from "@/lib/data/currencies";
import { LANGUAGES } from "@/lib/data/languages";
import { FooterDropdown } from "./FooterDropdown";

// Every href is a real, fully-built destination. "Careers" and "Affiliate"
// were deliberately dropped rather than built — this demo project has no
// real jobs or affiliate program, and a fake listing page would be worse
// than not having the link at all.
const NAV_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "Our Partners", href: "/#partners" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Site Map", href: "/site-map" },
  { label: "Frequently Asked Questions", href: "/#faq" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Testimonials", href: "/#students" },
];

/**
 * Global footer. About/mission copy and the legal line are original text
 * for this placeholder brand, not a real company's — see conversation
 * history for why "InterGreat", its specific claims, its copyright
 * notice, and a fabricated ICP filing number aren't reproduced here. The
 * trademark-ownership line below states a true, independently-verifiable
 * fact (IELTS is jointly owned by these three organizations) rather than
 * copying a specific company's disclaimer wording.
 */
export function SiteFooter() {
  return (
    <footer className="w-full bg-[#1e3048] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-10 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col justify-between gap-8">
          <nav aria-label="Footer">
            <ul className="space-y-4">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-semibold text-slate-400 no-underline hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-2">
            <FooterDropdown options={CURRENCIES} />
            <FooterDropdown options={LANGUAGES} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">About us</h2>
            <p className="mt-2 max-w-2xl text-xs font-normal leading-relaxed text-gray-300">
              IELTS Pathway is an independent practice platform built end-to-end as a demonstration project — timed
              Listening, Reading, Writing, and Speaking modules, automatic band-score conversion, and detailed
              per-question review, alongside an examiner-facing tool for scoring Writing and Speaking submissions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Our mission</h2>
            <p className="mt-2 max-w-2xl text-xs font-normal leading-relaxed text-gray-300">
              We want every candidate to walk into test day having already rehearsed it — the same timing, the same
              restricted audio controls, the same band-score mechanics. Combining automated scoring with real
              examiner feedback means practice should feel like the real thing, not a guessing game.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Follow us:</h3>
            {/* Not real links — this project has no actual social accounts
                to send visitors to, so these are presentational only
                rather than pointing at a fake "#" destination. */}
            <div className="mt-3 flex gap-3">
              <span
                aria-label="Facebook (not yet available)"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 shadow-sm"
              >
                <FacebookCircleIcon />
              </span>
              <span
                aria-label="YouTube (not yet available)"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 shadow-sm"
              >
                <YouTubePlayIcon />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 px-8 py-5">
        <p className="mx-auto max-w-4xl text-center text-xs leading-relaxed text-slate-500">
          © 2024–2026 IELTS Pathway. All rights reserved.
          <br />
          IELTS is a registered trademark of the British Council, IDP Education, and Cambridge Assessment English.
          This is an independent, non-commercial practice project and is not affiliated with, endorsed by, or
          connected to any of the above.
        </p>
      </div>
    </footer>
  );
}
