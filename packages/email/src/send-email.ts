import { consoleEmailAdapter } from "@workspace/email/adapters/console";
import type { SendEmail } from "@workspace/email/types";

/**
 * The active email sender. Console stub for now (ADR 0020); swap to a
 * Nodemailer/SMTP or provider adapter — selected by env — at deploy time, with no
 * change to consumers (the semantic senders in `messages.tsx`, and through them
 * `packages/auth` + future billing/notifications).
 *
 * Kept in its own module (not `index.ts`) so `messages.tsx` can import the active
 * sender without a barrel import cycle.
 */
export const sendEmail: SendEmail = consoleEmailAdapter;
