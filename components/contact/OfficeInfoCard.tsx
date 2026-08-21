import {
  FacebookCircleIcon,
  YouTubePlayIcon,
  InstagramGlyphIcon,
  ShortVideoGlyphIcon,
} from "@/components/icons/CommonIcons";

const SUPPORT_EMAIL = "support@ieltsclone.example";

// Representative-office regions — distinct from the homepage's "study
// abroad" destination list (a different concept: where a candidate might
// study vs. where this platform has support coverage). No fabricated
// street addresses, since this project has no real offices.
const REPRESENTATIVE_OFFICES = ["Global", "China", "India", "Sri Lanka", "Vietnam"];

const SOCIAL_LINKS = [
  { label: "Facebook", Icon: FacebookCircleIcon },
  { label: "YouTube", Icon: YouTubePlayIcon },
  { label: "Instagram", Icon: InstagramGlyphIcon },
  { label: "TikTok", Icon: ShortVideoGlyphIcon },
];

/** Right-hand contact-page card: regional coverage, socials, hours, support email — all honest placeholders, no fabricated addresses. */
export function OfficeInfoCard() {
  return (
    <div className="space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:p-8">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1b2a4a]">Representative Offices</h3>
        <ul className="mt-3 space-y-2">
          {REPRESENTATIVE_OFFICES.map((region) => (
            <li key={region} className="flex items-center justify-between text-sm text-gray-600">
              <span>{region}</span>
              <span className="text-xs text-gray-400">Details coming soon</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1b2a4a]">Business Hours</h3>
        <p className="mt-3 text-sm text-gray-600">Monday – Friday, 9:00 AM – 6:00 PM (GMT)</p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1b2a4a]">Support Email</h3>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-3 inline-block text-sm font-semibold text-[#00a8cc] no-underline hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1b2a4a]">Follow Us</h3>
        {/* Not real links — no actual social accounts exist yet for this
            project, so these are presentational only rather than a fake
            "#" destination. */}
        <div className="mt-3 flex gap-3">
          {SOCIAL_LINKS.map(({ label, Icon }) => (
            <span
              key={label}
              aria-label={`${label} (not yet available)`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shadow-sm"
            >
              <Icon />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
