import type { EmailMessage } from "../types";

interface GradedNotificationInput {
  to: string;
  candidateName: string;
  testTitle: string;
  moduleType: "WRITING" | "SPEAKING";
  bandScore: number;
  resultsUrl: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** "Your Writing/Speaking module has been graded" — the one trigger point wired up so far (module-attempts grading route). Candidate name/test title are escaped since they're rendered into raw HTML. */
export function buildGradedNotificationEmail(input: GradedNotificationInput): EmailMessage {
  const moduleLabel = input.moduleType === "WRITING" ? "Writing" : "Speaking";
  const subject = `Your ${moduleLabel} module has been graded — ${input.testTitle}`;
  const safeName = escapeHtml(input.candidateName);
  const safeTitle = escapeHtml(input.testTitle);

  const html = [
    `<p>Hi ${safeName},</p>`,
    `<p>Your <strong>${moduleLabel}</strong> module for <strong>${safeTitle}</strong> has been graded.</p>`,
    `<p>Band score: <strong>${input.bandScore.toFixed(1)}</strong></p>`,
    `<p><a href="${input.resultsUrl}">View your full results</a></p>`,
  ].join("\n");

  const text = [
    `Hi ${input.candidateName},`,
    "",
    `Your ${moduleLabel} module for ${input.testTitle} has been graded.`,
    `Band score: ${input.bandScore.toFixed(1)}`,
    "",
    `View your full results: ${input.resultsUrl}`,
  ].join("\n");

  return { to: input.to, subject, html, text };
}
