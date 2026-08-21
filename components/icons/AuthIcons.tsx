export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5c0-1.1.9-2 2-2h2.28a1 1 0 0 1 .95.68l1.2 3.6a1 1 0 0 1-.27 1.05L7.6 9.9a12.3 12.3 0 0 0 6.5 6.5l1.57-1.56a1 1 0 0 1 1.05-.27l3.6 1.2a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C10.7 21 3 13.3 3 4V5Z"
      />
    </svg>
  );
}

export function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.7 6.9C4.4 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.8 0 3.3-.5 4.6-1.3M9.9 5.2A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a13.6 13.6 0 0 1-2 2.9"
      />
    </svg>
  );
}

export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <span
      className={
        className ??
        "flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-red-600"
      }
    >
      G
    </span>
  );
}

export function FacebookGlyph({ className }: { className?: string }) {
  return (
    <span
      className={
        className ??
        "flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600"
      }
    >
      f
    </span>
  );
}
