import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import type { SendEmail } from "@workspace/email/types";
import { env } from "@workspace/env";

/**
 * Nodemailer / SMTP adapter (ADR 0014) — the portable production sender. Works with **any** SMTP
 * provider (Resend / SES / Postmark / …) by credentials alone, so the provider stays a
 * deploy-time env choice with no code lock-in. `server-only`: it holds transport credentials.
 *
 * Per Nodemailer's official guidance we keep **one pooled transporter, created lazily and
 * reused** — never one per message. Lazy init also keeps `next build` credential-free (ADR 0013):
 * nothing connects at import.
 */

// Implicit TLS on 465/2465; STARTTLS (plaintext upgraded) on 25/587/2587.
const IMPLICIT_TLS_PORTS = new Set([465, 2465]);

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      "SMTP email is selected but incomplete — set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD " +
        "(or unset SMTP_HOST to fall back to the console adapter). (ADR 0014)"
    );
  }

  const port = Number(SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    // Explicit override wins; otherwise implicit TLS on 465/2465, STARTTLS elsewhere.
    secure: SMTP_SECURE ?? IMPLICIT_TLS_PORTS.has(port),
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    // Reuse connections across messages — Nodemailer's guidance for a long-lived server.
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // We only ever send pre-rendered HTML — never read attachments from disk or fetch URLs.
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transporter;
}

/**
 * Send one message over SMTP. Rejects on transport failure (the `SendEmail` contract); callers
 * that must not fail the surrounding flow (e.g. the auth `sendResetPassword` / session hooks)
 * already wrap it in try/catch.
 */
export const smtpEmailAdapter: SendEmail = async (message) => {
  const { to, subject, html, text, from, replyTo, headers } = message;

  const fromAddress = from ?? env.EMAIL_FROM;
  if (!fromAddress) {
    throw new Error(
      "No From address — set EMAIL_FROM (or pass `from`) for SMTP sends. (ADR 0014)"
    );
  }

  await getTransporter().sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text,
    replyTo,
    headers,
  });
};
