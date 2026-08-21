import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";

// The reference site's own font — loaded once here and wired into
// tailwind.config.js's fontFamily.sans so it's the default everywhere,
// not just the navbar (Tailwind's preflight otherwise applies its own
// generic system-font stack to every element).
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

const SITE_NAME = "IELTS Pathway";
const SITE_DESCRIPTION =
  "Take full-length IELTS Listening, Reading, Writing, and Speaking mock tests online with instant auto-grading and examiner feedback. Track your band score progress over time.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} — Free IELTS Practice Tests & Mock Exams`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["IELTS", "IELTS practice test", "IELTS mock test", "IELTS online test", "IELTS band score", "IELTS preparation"],
  // Deliberately no `alternates.canonical` here: setting one at the root
  // layout would propagate "/" to every page that doesn't override it
  // (login/signup included), incorrectly telling search engines those pages
  // are duplicates of the homepage. Set per-page instead (see app/page.tsx)
  // — omitting it entirely for a page is safe/neutral, a wrong blanket
  // default is not.
  // Default for the whole site; overridden to noindex on the auth-gated
  // subtrees (/admin, /dashboard, /test — see their own layout.tsx) since
  // those pages have no public content and require login anyway.
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${SITE_NAME} — Free IELTS Practice Tests & Mock Exams`,
    description: SITE_DESCRIPTION,
    url: APP_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    // app/opengraph-image.tsx is auto-detected by Next.js and wired in here
    // without needing to reference it manually.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free IELTS Practice Tests & Mock Exams`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ClerkProvider is a context provider only — no UI of its own, so it
    // doesn't affect anything below it. Real UI stays 100% custom via the
    // headless useSignIn/useSignUp hooks (see app/login, app/signup) rather
    // than Clerk's prebuilt <SignIn>/<SignUp> components.
    //
    // signInUrl/signUpUrl/fallback-redirect props are NOT optional here: an
    // OAuth flow (Login with Google) briefly leaves this app entirely and
    // comes back through Clerk's own redirect infrastructure. Without
    // these, Clerk has no configured notion of where this app's sign-in
    // page or default post-auth destination actually are, and falls back
    // to its own hosted Account Portal ("Welcome... Start Building")
    // instead of completing the round trip back to localhost.
    <ClerkProvider signInUrl="/login" signUpUrl="/signup" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      <html lang="en" className={nunito.variable}>
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          <SiteChrome>{children}</SiteChrome>
        </body>
      </html>
    </ClerkProvider>
  );
}
