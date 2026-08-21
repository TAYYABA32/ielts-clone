import type { MetadataRoute } from "next";

/**
 * /admin, /dashboard, /test are all Clerk-auth-gated (middleware.ts) with no
 * public content — disallowed here as a courtesy to well-behaved crawlers
 * (saves crawl budget) alongside the noindex metadata on each of those
 * subtrees' layouts, which is what actually keeps them out of search
 * results even if linked from elsewhere.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/test", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
