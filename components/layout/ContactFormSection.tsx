import Link from "next/link";

// Teaser only — the full form (validation, char counter, loading/success/
// error states) lives on the dedicated /contact page so there's one
// authoritative contact form, not two divergent copies of the same UI.
export function ContactFormSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
          Get in <span className="text-[#00b4d8]">Touch</span>
        </h2>
        <p className="mt-3 text-sm text-gray-500">Questions about a mock test or a course? Send us a message.</p>

        <Link
          href="/contact"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white no-underline shadow-lg transition-colors hover:bg-[#0f172a] hover:no-underline"
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}
