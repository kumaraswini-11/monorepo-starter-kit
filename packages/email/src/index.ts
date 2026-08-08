import { consoleEmailAdapter } from "@workspace/email/adapters/console";
import type { SendEmail } from "@workspace/email/types";

export type { EmailMessage, SendEmail } from "@workspace/email/types";
export { consoleEmailAdapter } from "@workspace/email/adapters/console";

/**
 * The active email sender. Console stub for now (ADR 0020); swap to a
 * Nodemailer/SMTP or provider adapter — selected by env — at deploy time, with no
 * change to consumers (`packages/auth`, future billing/notifications).
 */
export const sendEmail: SendEmail = consoleEmailAdapter;
