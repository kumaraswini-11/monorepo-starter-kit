export type { EmailMessage, SendEmail } from "@workspace/email/types";
export { consoleEmailAdapter } from "@workspace/email/adapters/console";
export { smtpEmailAdapter } from "@workspace/email/adapters/smtp";

/**
 * The active email sender (console stub for now — ADR 0020). Prefer the semantic
 * senders below; use this only for one-off/ad-hoc messages.
 */
export { sendEmail } from "@workspace/email/send-email";

/**
 * Semantic senders — the intended email surface for `packages/auth` and other
 * callers. Each renders a template + applies the subject, then delegates to the
 * `sendEmail` port. See `messages.tsx`.
 */
export {
  sendAccountUnlockedEmail,
  sendInviteEmail,
  sendNewDeviceEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
} from "@workspace/email/messages";
