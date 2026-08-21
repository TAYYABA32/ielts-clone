import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/sendEmail";
import { handleApiError } from "@/lib/api/handleApiError";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

const contactRequestSchema = z.object({
  userType: z.string().min(1).max(100),
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  countryCode: z.string().min(1).max(10),
  phone: z.string().min(1).max(30),
  message: z.string().min(10).max(500),
});

const CONTACT_INBOX_EMAIL = process.env.CONTACT_INBOX_EMAIL ?? "support@ieltsclone.example";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * POST /api/contact — the contact form's real submission target. No new
 * Prisma model: this is a fire-and-forget notification email via the
 * existing lib/email/sendEmail pipeline (Resend, falling back to a
 * console-logged no-op in dev/when unconfigured), not a durable record —
 * matching this app's existing "notification delivery is best-effort,
 * decoupled from the triggering action" pattern (see sendEmail.ts).
 */
export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.contact);

    const body = contactRequestSchema.parse(await request.json());

    const html = `
      <h2>New contact form submission</h2>
      <p><strong>From:</strong> ${escapeHtml(body.fullName)} (${escapeHtml(body.email)})</p>
      <p><strong>I am a:</strong> ${escapeHtml(body.userType)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(body.countryCode)} ${escapeHtml(body.phone)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(body.message).replace(/\n/g, "<br />")}</p>
    `.trim();

    await sendEmail({
      to: CONTACT_INBOX_EMAIL,
      subject: `Contact form: ${body.fullName}`,
      html,
      text: `From: ${body.fullName} (${body.email})\nI am a: ${body.userType}\nPhone: ${body.countryCode} ${body.phone}\n\n${body.message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
