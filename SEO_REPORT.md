# SEO Report — IELTS Clone

**Date:** 2026-08-05
**Scope:** Metadata, Open Graph, Twitter Cards, canonical URLs, JSON-LD, `robots.txt`, `sitemap.xml`, breadcrumb structured data, dynamic metadata, social sharing.

## Context that shapes every decision below

This app is a mix of one public marketing surface (`/`, `/login`, `/signup`) and a large authenticated surface (`/admin`, `/dashboard`, `/test`) that requires a Clerk session for every route (`middleware.ts`) and has zero content of public/SEO value — a search engine cannot render it past the login redirect, and even if it could, showing a specific student's test attempts or an admin's CMS in search results would be actively wrong. Every decision here follows from that split: invest in the marketing surface, explicitly exclude the authenticated one.

## Implemented

### Metadata (`app/layout.tsx`)
Expanded from a bare `{ title, description }` to a full site-wide default: title template (`%s | IELTS Online Tests`, so any page that sets its own `title` gets it appended automatically rather than replacing brand context), keyword list, Open Graph, and Twitter Card fields, plus `metadataBase` (from `NEXT_PUBLIC_APP_URL`) so every relative URL used anywhere in metadata resolves correctly.

### Open Graph + Twitter Cards + share image
`app/opengraph-image.tsx` generates the share-preview image on the fly via `next/og`'s `ImageResponse` — there is no static image asset anywhere in this project (`public/` is empty; the marketing UI is built entirely from inline icon components), so a designed asset didn't exist to reference. Next.js auto-detects this file and wires it into both `openGraph.images` and `twitter.images` without any manual metadata reference. **Verified live:** started a production server and confirmed `/opengraph-image` returns a real `1200×630` PNG (`content-type: image/png`, `size=630`), and that the homepage's rendered `<head>` carries the full expected `og:*` tag set pointing at it.

### Canonical URLs
**Caught and corrected during implementation, not shipped wrong:** the first pass set `alternates.canonical: "/"` at the *root layout*, which would have propagated `"/"` as the canonical URL for every page that doesn't override it — including `/login` and `/signup`, incorrectly telling search engines those pages are duplicates of the homepage (which could suppress them from search results entirely, since canonical tells engines to attribute all ranking signal to the target instead). Fixed by removing it from the root layout and setting it only on `app/page.tsx` itself, which is a Server Component and can carry its own `metadata` export. `/login` and `/signup` are Client Components (`"use client"` — they use Clerk's headless `useSignIn`/`useSignUp` hooks), and **Next.js does not allow a Client Component page to export `metadata`** — giving them their own canonical would require adding a thin Server Component `layout.tsx` wrapper for each, which wasn't done in this pass (documented under "Not done" below, not silently skipped).

### JSON-LD
A `WebSite` schema (name, description, url) on the homepage, rendered via `<script type="application/ld+json">` + `JSON.stringify()` — Next.js's own documented pattern for structured data. This is the one deliberate use of `dangerouslySetInnerHTML` in the entire codebase (`SECURITY_AUDIT.md` confirmed zero prior usage); safe here specifically because the object being stringified is fully static and hardcoded, never touches user input. **Deliberately `WebSite`, not `Organization`:** `Organization` schema implies factual claims (registered address, founding date, etc.) this project has no honest answer for — it's a clone/demo, not a real business. Fabricating those fields to look more "complete" would be actively dishonest structured data, not a documentation gap.

### `robots.txt` (`app/robots.ts`)
Disallows `/admin`, `/dashboard`, `/test`, `/api` — all auth-gated, all zero public content — and points to the sitemap. **Verified live** via a real server: correct `Disallow` rules and `Sitemap:` line.

### `sitemap.xml` (`app/sitemap.ts`)
Deliberately short: homepage (priority 1, weekly), `/signup` (priority 0.5, monthly), `/login` (priority 0.3, monthly). Nothing else in the app has public content to list — a long sitemap padded with noindexed URLs doesn't help anything and can dilute crawl priority signals. **Verified live**: valid XML, correct `<loc>`/`<priority>`/`<changefreq>` per entry.

### `noindex` on every auth-gated subtree
`app/admin/layout.tsx` (existing, from M3.1 — added a `metadata` export), `app/dashboard/layout.tsx` (new), `app/test/layout.tsx` (new) all set `robots: { index: false, follow: false }`. This is *defense in depth* alongside `robots.txt`'s `Disallow`: `robots.txt` only asks well-behaved crawlers not to *crawl* a path (a crawler that ignores it, or a URL discovered via an external link, could still be indexed with no snippet); the `noindex` meta tag is what actually guarantees a crawled page won't appear in results. Both together is the standard combination. Not directly curl-verified against a live server for these three specific subtrees (they require a Clerk session — an unauthenticated request just gets redirected to `/login`, so there's no page HTML to inspect without real credentials), but the underlying mechanism (Next.js metadata inheritance from a layout to its child pages) was confirmed working via the homepage's own metadata rendering correctly in the live smoke test above — the same, standard, documented mechanism.

## Not done (with reasoning, not silently skipped)

- **Canonical URLs for `/login`/`/signup`:** would need a Server Component `layout.tsx` wrapper for each (Client Component pages can't export `metadata`) — a small addition, not implemented in this pass since these are low-priority pages (no unique content to protect from duplication) rather than a genuine defect.
- **Breadcrumb structured data:** not implemented. Breadcrumb schema exists to help search engines understand a *hierarchical, indexed content structure* (category → subcategory → article, etc.). This app's only indexed content is a single marketing homepage plus two auth pages — there is no indexed hierarchy for breadcrumbs to describe. Adding contrived breadcrumb markup with no real hierarchy behind it would be structured data for its own sake, not a genuine SEO improvement. Revisit if a public, browsable, indexed content section (e.g. a public test catalog) is ever built.
- **Dynamic per-route metadata for authenticated pages** (e.g. a test's actual title in the browser tab on the admin Test Builder): would be a UX nicety, not an SEO one, since these routes are `noindex` regardless — out of scope for an SEO pass specifically, not a gap in it.
- **Twitter `site`/`creator` handles:** no real Twitter/X account exists for this project to reference; omitted rather than fabricated.

## Verification

`tsc`, `eslint`, `vitest` (120/120), and `next build` all pass. Beyond the standard gate, this milestone included a live production-server smoke test (same approach as M4.1's health-endpoint verification) confirming `robots.txt`, `sitemap.xml`, the generated OG image, and the homepage's full meta-tag/JSON-LD output are all genuinely correct — not just "the build didn't error."
