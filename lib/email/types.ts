export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Every provider (Resend, Postmark, SES, a local no-op) implements this one contract — swapping providers never touches a call site. */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
