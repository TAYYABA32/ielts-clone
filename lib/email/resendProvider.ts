import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./types";

let cachedClient: Resend | null = null;

/** Lazily constructed so a missing API key only surfaces when an email is actually sent, not at module load / build time — same pattern as the Supabase/Upstash clients. */
function getResendClient(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set to use the Resend email provider.");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? "IELTS Pathway <notifications@example.com>";

export const resendProvider: EmailProvider = {
  async send(message: EmailMessage) {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }
  },
};
