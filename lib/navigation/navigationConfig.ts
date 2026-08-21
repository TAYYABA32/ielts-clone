export interface NavChildItem {
  label: string;
  href: string;
}

export interface NavItemConfig {
  label: string;
  href: string;
  children?: NavChildItem[];
}

/**
 * Primary navigation. Every destination here is a genuinely functional
 * page — no ComingSoon placeholders. Two items from the reference site's
 * own menu structure were deliberately simplified or dropped rather than
 * built as fake commerce/product pages this app has no real backend for:
 *
 * - "IELTS Prep" (reference: 11 sub-links to paid products — sample
 *   essay downloads, PDF packs, recorded-video packages) collapses to one
 *   real link, since this app's actual "prep" offering is its mock test
 *   collection, not a storefront.
 * - The reference's separate "HSK AI Test" promo tab was dropped entirely
 *   (a Chinese-proficiency cross-sell, unrelated to an IELTS product).
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Exam Library",
    href: "/collection",
    children: [
      { label: "IELTS Reading Tests", href: "/collection?skill=reading" },
      { label: "IELTS Writing Tests", href: "/collection?skill=writing" },
      { label: "IELTS Speaking Tests", href: "/collection?skill=speaking" },
      { label: "IELTS Listening Tests", href: "/collection?skill=listening" },
      { label: "IELTS Test Collection", href: "/collection" },
    ],
  },
  {
    label: "IELTS Tips",
    href: "/ielts-tips",
    children: [
      { label: "Listening Tips", href: "/ielts-tips/listening" },
      { label: "Reading Tips", href: "/ielts-tips/reading" },
      { label: "Speaking Tips", href: "/ielts-tips/speaking" },
      { label: "Writing Tips", href: "/ielts-tips/writing" },
      { label: "IELTS Grammar", href: "/ielts-tips/grammar" },
      { label: "Announcements", href: "/announcements" },
    ],
  },
  {
    label: "IELTS Prep",
    href: "/collection",
  },
  {
    label: "Live Lessons",
    href: "/live-lessons",
    children: [
      { label: "Reading", href: "/live-lessons?skill=reading" },
      { label: "Speaking", href: "/live-lessons?skill=speaking" },
      { label: "Writing", href: "/live-lessons?skill=writing" },
      { label: "Listening", href: "/live-lessons?skill=listening" },
    ],
  },
];
