import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarAsync } from "@/components/layout/NavbarAsync";
import { HeroCarousel } from "@/components/layout/hero/HeroCarousel";
import { SixStepsSection } from "@/components/layout/SixStepsSection";
import { LiveLessonsSection } from "@/components/layout/LiveLessonsSection";
import { MockTestsBanner } from "@/components/layout/MockTestsBanner";
import { OfficialMaterialsSection } from "@/components/layout/OfficialMaterialsSection";
import { StudentTrustSection } from "@/components/layout/StudentTrustSection";
import { FeaturesShowcaseSection } from "@/components/layout/FeaturesShowcaseSection";
import { PartnerLogosSection } from "@/components/layout/PartnerLogosSection";
import { FaqSection } from "@/components/layout/FaqSection";
import { ContactFormSection } from "@/components/layout/ContactFormSection";
import { OfficeLocationsSection } from "@/components/layout/OfficeLocationsSection";
import { FloatingActionBadges } from "@/components/layout/FloatingActionBadges";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";

// Static, fully-controlled object — no user input flows into this. Next.js's
// own documented pattern for JSON-LD is exactly this <script> + stringify
// approach; it's the one deliberate exception to this app otherwise having
// zero dangerouslySetInnerHTML usage (see SECURITY_AUDIT.md's XSS section).
// Deliberately WebSite only, not Organization — this is a clone/demo
// project, not a real registered business, and Organization schema implies
// factual claims (address, founding date, etc.) this project has no honest
// answer for.
const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IELTS Pathway",
  description:
    "Take full-length IELTS Listening, Reading, Writing, and Speaking mock tests online with instant auto-grading and examiner feedback.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

// Page-level, not root-layout-level (see app/layout.tsx's comment on why).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      {/* eslint-disable-next-line react/no-danger -- static, hardcoded JSON-LD, not user input; see comment on WEBSITE_JSON_LD above */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }} />

      {/* Header: sticky, not part of the section flow below. Streamed
          independently (PERFORMANCE_REPORT.md) — everything below is fully
          static and shouldn't wait on this component's DB-backed auth check.
          Trade-off: an already-logged-in visitor may see the signed-out
          header for a moment before it swaps in, in exchange for every
          anonymous visitor (the common case on a marketing page) getting an
          instant paint instead of waiting on a DB round-trip. */}
      <Suspense fallback={<Navbar user={null} />}>
        <NavbarAsync />
      </Suspense>
      <FloatingActionBadges />
      <ScrollToTopButton />

      {/* 1. Hero Section */}
      <HeroCarousel />

      {/* 2. 6 Steps to Achieve Your IELTS Goal */}
      <SixStepsSection />

      {/* 3. Live Lessons Section */}
      <LiveLessonsSection />

      {/* 4. Mock Tests Stats Banner — also the target of the "GET FREE IELTS
          MOCK TEST" CTA below (the full library lives at /collection) */}
      <section id="tests" className="bg-[#f8f9fa] px-4 py-20">
        <MockTestsBanner />
      </section>

      {/* 5. 2026 Official IELTS Practice Materials */}
      <section className="bg-[#f8f9fa] px-4 pb-20">
        <OfficialMaterialsSection />
      </section>

      {/* 6. Student Trust Photo Grid Banner — sits directly below the
          Practice Materials section's "EXPLORE MORE" button */}
      <StudentTrustSection />

      {/* 7. Why practice here — feature showcase */}
      <FeaturesShowcaseSection />

      {/* 8. Partner institutions (placeholder logos — see component comment) */}
      <PartnerLogosSection />

      {/* 9. FAQ */}
      <FaqSection />

      {/* 10. Contact form (static/inert — no backend submission) */}
      <ContactFormSection />

      {/* 11. Regional support / office locations (placeholder — see component comment) */}
      <OfficeLocationsSection />

      {/* 12. Footer is rendered globally by SiteChrome, right after this page's content */}
    </main>
  );
}
