// Build-time guard: the transport (SMTP/provider creds) is server-only —
// fail if a client bundle imports it (ADR 0016). Templates stay isomorphic.
import "server-only";

import { consoleEmailAdapter } from "@workspace/email/adapters/console";
import { smtpEmailAdapter } from "@workspace/email/adapters/smtp";
import type { SendEmail } from "@workspace/email/types";
import { env } from "@workspace/env";

/**
 * The active email sender, chosen by env (ADR 0014): the **Nodemailer/SMTP** adapter when
 * `SMTP_HOST` is configured (any provider — Resend/SES/… — by credentials), otherwise the
 * **console stub** for local dev/test. Consumers (the semantic senders in `messages.tsx`, and
 * through them `packages/auth` + future billing/notifications) never change — the provider is a
 * credentials-only, deploy-time choice.
 *
 * **Production never falls back to the console stub:** it prints the message body — i.e. the
 * verification / reset links, which are bearer tokens — to stdout, where a log aggregator would
 * keep them. A production runtime without `SMTP_HOST` therefore fails every send loudly (the
 * auth hooks catch and log it) instead of leaking tokens while users "check their inbox".
 *
 * Kept in its own module (not `index.ts`) so `messages.tsx` can import the active sender without
 * a barrel import cycle.
 */
export const sendEmail: SendEmail = env.SMTP_HOST
  ? smtpEmailAdapter
  : env.NODE_ENV === "production"
    ? () =>
        Promise.reject(
          new Error(
            "No email transport in production — set SMTP_HOST (+ SMTP_USER/SMTP_PASSWORD/" +
              "EMAIL_FROM); the console adapter is dev/test only. (ADR 0014)"
          )
        )
    : consoleEmailAdapter;
