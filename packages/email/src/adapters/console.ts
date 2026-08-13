import type { SendEmail } from "@workspace/email/types";

/**
 * Dev/test adapter (ADR 0020): logs the message — including any verification /
 * reset link in the body — to the server console instead of sending. Lets the auth
 * flows work end-to-end with no email vendor. Swap for a Nodemailer/SMTP or provider
 * adapter in production.
 */
export const consoleEmailAdapter: SendEmail = (message) => {
  const { to, subject, text, html } = message;
  console.info(
    `\n[email:console] → ${to}\n  subject: ${subject}\n  body:\n${text ?? html}\n`
  );
  return Promise.resolve();
};
