/**
 * Content-Security-Policy — shipped as Report-Only, not enforcing, per
 * SECURITY_AUDIT.md M1. Rationale: this app can't be live-browser-tested in
 * this environment against the actual deployed Clerk frontend-API domain,
 * and an incorrectly *enforcing* CSP risks silently breaking authentication
 * for the whole app — a worse outcome than having no CSP yet. Report-Only
 * lets the policy be observed (violations show in browser devtools /
 * `report-to`, nothing is blocked) so it can be verified against real
 * traffic before flipping the header name to `Content-Security-Policy`
 * (enforcing). `'unsafe-inline'` on script-src is a known, documented gap —
 * removing it needs a nonce threaded through Next's app-router rendering,
 * which is a real follow-up, not done here blind.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://img.clerk.com https://images.clerk.dev https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.com https://*.supabase.co https://*.upstash.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-src https://*.clerk.accounts.dev https://*.clerk.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained production build (server + only the node_modules it
  // actually needs) for the Docker image — see Dockerfile/DEPLOYMENT.md.
  // Harmless for the Vercel/Railway deploy paths, which ignore it.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Removes the "X-Powered-By: Next.js" header (SECURITY_AUDIT.md L1) — a
  // trivial framework-fingerprinting info leak, free to close.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // microphone=(self): the Speaking module records audio on this
          // app's own origin (components/test-engine/AudioRecorder.tsx) —
          // this restricts the mic/camera/geolocation APIs to this origin
          // only, it does not disable the app's own microphone use.
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
          { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports -- next.config.js is CommonJS; this is Sentry's own documented require() pattern for it
const { withSentryConfig } = require("@sentry/nextjs");

// withSentryConfig is safe to apply without SENTRY_AUTH_TOKEN/org/project set
// — it just skips source-map upload (a warning, not a build failure) until
// those are configured. See DEPLOYMENT.md for what's needed to enable that.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
