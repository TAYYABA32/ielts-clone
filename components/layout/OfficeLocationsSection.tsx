import { SUPPORTED_REGIONS } from "@/lib/data/regions";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Placeholder regional-office cards. No fabricated street addresses — this
 * project has no real offices, so each card is honestly labeled rather than
 * inventing a specific, verifiable-looking location. Regions match the
 * hero's "study abroad" slide and the contact page's office list.
 */
export function OfficeLocationsSection() {
  return (
    <section className="bg-[#f8f9fa] px-4 py-16">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-2xl font-extrabold text-[#1b2a4a] md:text-3xl">Regional Support</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          Contact details for our regional teams are being finalized.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_REGIONS.map((region) => (
            <div key={region} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
              <PinIcon className="h-6 w-6 text-[#00b4d8]" />
              <p className="text-sm font-bold text-[#1b2a4a]">{region}</p>
              <p className="text-xs text-gray-400">Office details coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
