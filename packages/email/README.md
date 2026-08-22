# @workspace/email

Transactional email — **React Email** templates behind a `SendEmail` port. Provider-agnostic;
ships a console adapter for dev (a real provider drops in behind the port at deploy).

## Entry points

| Import                                               | What                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `@workspace/email`                                   | semantic senders (verify, reset, password-changed, new-device) |
| `@workspace/email/send-email`                        | the `SendEmail` port                                           |
| `@workspace/email/adapters/console`                  | dev console adapter (default)                                  |
| `@workspace/email/render` · `./messages` · `./types` | rendering + message contracts                                  |
| `@workspace/email/emails/*` · `./components/*`       | React Email templates + shared pieces                          |

Server-only. See ADR [0020](../../docs/decisions/0020-email-transactional-messaging.md).
