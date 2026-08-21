export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Generic person silhouette — evokes a "photo card" without claiming to be an actual photograph of a real person. */
export function PersonSilhouetteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1Z" />
    </svg>
  );
}

// Just the glyph — circular button chrome (bg-white, rounded-full, size,
// shadow) lives on the wrapping <a> in SiteFooter so Facebook and YouTube
// render as genuinely identical buttons, not two components each baking in
// their own slightly different circle.
export function FacebookCircleIcon({ className }: { className?: string }) {
  return <span className={className ?? "text-sm font-bold text-slate-800"}>f</span>;
}

/** Generic "play" triangle — evokes a video-platform link without reproducing any specific brand's trademarked logo mark. */
export function YouTubePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} aria-hidden="true">
      <path d="M10 8.3v7.4l6.5-3.7-6.5-3.7Z" fill="#e02b2b" />
    </svg>
  );
}

/** Generic rounded-square-with-dot camera glyph — evokes a photo-sharing platform link without reproducing any specific brand's trademarked logo mark. */
export function InstagramGlyphIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Generic musical-note glyph — evokes a short-video platform link without reproducing any specific brand's trademarked logo mark. */
export function ShortVideoGlyphIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v11a3.5 3.5 0 1 1-2-3.16V4h2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4c.5 2 2.2 3.5 4 3.7" />
    </svg>
  );
}

/**
 * Original line-art icon for the "Library" quick-action — a document with a
 * folded corner and three text lines (document/learning), plus a small
 * cyan play-button badge (media/audio). Not a copy of any specific
 * third-party icon; thin, rounded strokes throughout for a premium feel.
 */
export function LibraryLineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className ?? "h-9 w-9"} fill="none" aria-hidden="true">
      <path
        d="M9 5h13l5 5v21a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 5v5h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 17h9M11 21h9M11 25h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="27" r="5" fill="#00BCD4" />
      <path d="M23.3 25.1v3.8l3.2-1.9-3.2-1.9Z" fill="#fff" />
    </svg>
  );
}

/**
 * Original line-art icon for the "Contact Us" quick-action — a headset
 * (support) shape with a subtle circular "24" badge, inspired by 24/7
 * customer support. Not a copy of any specific third-party icon.
 */
export function SupportHeadsetLineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className ?? "h-9 w-9"} fill="none" aria-hidden="true">
      <path d="M7 19a11 11 0 0 1 22 0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="18" width="5.5" height="9" rx="2.75" stroke="currentColor" strokeWidth={1.5} />
      <rect x="26.5" y="18" width="5.5" height="9" rx="2.75" stroke="currentColor" strokeWidth={1.5} />
      <path d="M32 24.5v3a4.5 4.5 0 0 1-4.5 4.5H24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27.5" cy="8.5" r="6" fill="#00BCD4" />
      <text x="27.5" y="11" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif">
        24
      </text>
    </svg>
  );
}
