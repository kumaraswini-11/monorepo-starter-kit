import { consoleEmailAdapter } from "./adapters/console.js";
import type { SendEmail } from "./types.js";

export type { EmailMessage, SendEmail } from "./types.js";
export { consoleEmailAdapter } from "./adapters/console.js";

/**
 * The active email sender. Console stub for now (ADR 0020); swap to a
 * Nodemailer/SMTP or provider adapter — selected by env — at deploy time, with no
 * change to consumers (`packages/auth`, future billing/notifications).
 */
export const sendEmail: SendEmail = consoleEmailAdapter;
