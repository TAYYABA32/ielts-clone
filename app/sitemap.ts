import type { MetadataRoute } from "next";

/**
 * Deliberately short: almost everything else in this app (dashboard, admin,
 * test-taking) is auth-gated with no public content, so it has no business
 * in a sitemap regardless of crawl-budget concerns — see app/robots.ts and
 * SEO_REPORT.md for the full reasoning.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
