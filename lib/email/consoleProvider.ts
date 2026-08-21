import type { EmailProvider } from "./types";

/**
 * No-op provider — logs instead of sending. Used automatically whenever no
 * real provider is configured (e.g. local dev without RESEND_API_KEY), so
 * missing email credentials never break the app — same fail-safe posture as
 * rate limiting's fail-open behavior when Upstash isn't configured.
 */
export const consoleProvider: EmailProvider = {
  async send(message) {
    // eslint-disable-next-line no-console -- deliberate stand-in for real delivery when unconfigured
    console.info(`[email:console-provider] Would send to ${message.to}: "${message.subject}"`);
  },
};
