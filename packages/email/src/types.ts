/** A transactional email to send. The body is pre-rendered HTML (+ optional text). */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

/**
 * The email port. Every sender — the console stub, a Nodemailer/SMTP transport, or
 * a provider SDK — is interchangeable behind this one interface, so the provider is
 * a swappable, deploy-time choice (ADR 0014).
 */
export type SendEmail = (message: EmailMessage) => Promise<void>;
