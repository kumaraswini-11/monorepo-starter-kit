# @workspace/email

Transactional email — **React Email** templates behind a `SendEmail` port. Provider-agnostic:
a **console** adapter for dev and a **Nodemailer/SMTP** adapter for production, chosen by env
with no consumer changes.

## Entry points

| Import                                               | What                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `@workspace/email`                                   | semantic senders (verify, reset, password-changed, new-device) |
| `@workspace/email/send-email`                        | the active `SendEmail` (env-selected)                          |
| `@workspace/email/adapters/console`                  | dev/test console adapter (logs the message)                    |
| `@workspace/email/adapters/smtp`                     | Nodemailer/SMTP adapter (production)                           |
| `@workspace/email/render` · `./messages` · `./types` | rendering + message contracts                                  |
| `@workspace/email/emails/*` · `./components/*`       | React Email templates + shared pieces                          |

## Sending in production

`sendEmail` picks the adapter from env: **`SMTP_HOST` set → SMTP**, otherwise the console stub.
The SMTP adapter is provider-agnostic (Resend / Amazon SES / Postmark / any SMTP), so the provider
is a **credentials-only, deploy-time** choice. Nothing in the codebase needs an API key — dev uses
the console stub, CI builds with `SKIP_ENV_VALIDATION`, and tests mock the transport.

### Using Resend (first provider) — one-time operational setup, not code

1. Create a **Resend account** and an **API key** (resend.com).
2. **Verify your sending domain** — add the SPF/DKIM (and DMARC) DNS records Resend shows and wait
   for verification. Unverified, you can only send from `onboarding@resend.dev` to your own address.
3. Set these in your host's **secret store** (never commit them — see `.env.example`):
   - `SMTP_HOST=smtp.resend.com` · `SMTP_PORT=465` · `SMTP_USER=resend`
   - `SMTP_PASSWORD=<your Resend API key>` — the key **is** the SMTP password; there is **no**
     separate `RESEND_API_KEY` (we send over SMTP, not the SDK).
   - `EMAIL_FROM=<sender@your-verified-domain>`

Switching provider later (e.g. Amazon SES for EU residency) is an **env change only** — same
adapter, no code. Best practices + the provider R&D:
ADR [0014](../../docs/decisions/0014-email-transactional-messaging.md).

Server-only.
