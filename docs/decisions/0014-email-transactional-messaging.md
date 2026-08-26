# 0014. Email / transactional messaging — React Email + a `sendEmail` port; provider deferred

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Authentication needs to send email **now** (signup verification, password reset;
later magic-link / email-OTP), and **billing / notifications** will need it later.
Email is a **cross-cutting concern**, so — before wiring anything — we evaluated the
library + provider landscape and _where it should live_, holding each assumption up
to scrutiny.

Questions this ADR answers:

1. Best **authoring** library for templates — React Email vs MJML vs Maizzle?
2. Best **sending** approach — Nodemailer/SMTP vs provider SDKs — and how to keep it
   swappable?
3. Best **provider** — Resend / Postmark / Amazon SES / SendGrid / Mailgun /
   self-hosted SMTP — for a compliance-bound, self-host-leaning product, and are we
   locked in?
4. **Where does it live** in the monorepo?

### How we decided

Per the repo methodology ([0001](0001-decision-making-methodology.md)), the analysis was
produced by **two parallel, internet-wide research passes** against **official docs**
(react.email, nodemailer.com, and each provider's docs / pricing / compliance pages)
**+ reputable 2026 comparisons**; verdicts below cite them (full list in _Sources_).

## Questions & critiques interrogated

- **"Which email library is best right now?"** — don't default to the popular name;
  evaluate authoring vs sending as separate layers.
- **"If we pick a provider, are we locked in?"** — pressure-test the lock-in fear.
- **"Should we self-host SMTP to avoid a vendor entirely?"** — is that actually wise?
- **"Where do we keep it** so auth + future features share it **and** the provider
  stays swappable?"

## Key finding (reframes the decision)

**Every serious provider — Resend, Postmark, SES, SendGrid, Mailgun — exposes a
standard SMTP endpoint** (and self-hosted Postfix _is_ SMTP). So provider lock-in at
the **send layer is largely moot**: behind a `sendEmail` port over SMTP you switch
providers by changing **env credentials**, not code. The residual lock-in is _soft_
(proprietary template engines, hosted analytics, suppression lists, API-only SDKs) and
is avoided by rendering with an open renderer + sending over SMTP. **Portability is
therefore an architecture decision, not a provider one** — which lets us defer the
provider choice with zero risk.

## Decision

- **Authoring — React Email** (`@react-email/components` + `@react-email/render`):
  MIT, renders JSX to **provider-agnostic HTML + plain-text**, has a `<Tailwind>`
  component (reuse our design tokens), and a hot-reload preview server.
- **Transport — a `sendEmail` port + swappable adapters:** a **console/stream stub**
  (dev/test), **Nodemailer over SMTP** (the universal, anti-lock-in default), and an
  optional **provider SDK** adapter for richer features. Adapter chosen by env/DI.
- **Provider — deferred to deploy time (reversible via SMTP).** Lean: **Amazon SES**
  primary (compliance + EU residency + cost), **Resend** fast-start (SES underneath;
  best DX), **Postmark** if deliverability outweighs its US-only storage.
- **Placement — a dedicated `packages/email`** package: the **only** importer of a
  transport/SDK, exposing the `sendEmail` port + adapters + React Email templates.
  Consumed by `packages/auth` (fed into Better Auth's `sendResetPassword` /
  `sendVerificationEmail`) and by future billing/notifications. Same one-way isolation
  boundary as `packages/db` ([0012](0012-data-layer-postgres-drizzle.md)).
- **Now — console stub** in `packages/email` (this refines the auth plan's D3); React
  Email templates + a real provider adapter land later, with the UI phase.

## Options considered

**Authoring**

| Choice            | Verdict                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **React Email**   | ✅ **Chosen** — React/TS-native, provider-agnostic HTML+text, Tailwind, preview server              |
| MJML              | Alternative — safest for **Outlook-desktop-heavy B2B** (compiles to Outlook-safe tables); not React |
| Maizzle           | Alternative — Tailwind-first, max HTML control; not React                                           |
| Hand-written HTML | ❌ — unmaintainable, error-prone across email clients                                               |

**Transport**

| Choice                          | Verdict                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **`sendEmail` port + adapters** | ✅ **Chosen** — console stub / Nodemailer-SMTP / provider SDK, env-selected     |
| Nodemailer over SMTP            | ✅ the universal, portable default adapter (any provider via creds)             |
| Provider SDK only (API-only)    | ❌ as the _sole_ path — reintroduces soft lock-in; fine as one optional adapter |

**Provider** (deferred; leanings)

| Choice           | Verdict                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Amazon SES**   | **Primary lean** — SMTP-native, cheapest, strongest compliance + real EU residency                 |
| Resend           | **Fast-start** — best DX + native React Email; it's SES underneath; SOC 2; _US metadata storage_   |
| Postmark         | **Runner-up** — best transactional deliverability + DX; **US-only storage** (fails EU residency)   |
| SendGrid         | ❌ — killed permanent free plan; US-centric; less polished DX                                      |
| Mailgun          | ~ — has a true EU region, but pricier entry (~$75+/mo, +$10 EU)                                    |
| Self-hosted SMTP | ❌ (default) — worst deliverability (IP warmup 4–6 wks, blocklists); revisit only with a hard need |

## Q1 — Authoring: React Email is the modern standard

React Email's docs describe it as "a framework for constructing and delivering emails
using React and TypeScript," and it is explicitly **provider-agnostic**: author with
primitives (`Html`, `Container`, `Section`, `Button`, `Text`, `Img`, …), then
`render(<Template/>)` from `@react-email/render` yields a plain **HTML string** usable
by any provider, plus a plain-text alternative (`render(t, { plainText: true })`). Its
docs list integrations for Resend, Nodemailer, Mailgun, SendGrid, Postmark, AWS SES,
Azure, and more — confirming the output is sender-neutral. Adoption ≈ **500K weekly npm
downloads**; it supports Tailwind via `<Tailwind>`, and ships a hot-reload preview
server (`email dev`, port 3000) with `PreviewProps` mock data.

- **Alternatives:** **MJML** (~1M downloads) compiles to Outlook-safe table HTML — the
  safest choice **only if** Outlook-desktop-heavy B2B becomes primary; **Maizzle**
  (~50K) is Tailwind-first with maximal HTML control. Neither offers React components.
- **Honest caveats:** React Email is **younger** than MJML; **Outlook-on-Windows**
  (Word engine) ignores flexbox/grid/CSS-vars/many radii; and **Gmail clips messages
  larger than 102 KB**. Test real templates (Litmus / Email on Acid) for Outlook-heavy
  B2B; React Email is most reliable for B2C (Gmail / Apple Mail / Outlook.com).

## Q2 — Sending: a port + swappable adapters

Because authoring already yields raw HTML, sending is a **replaceable capability**.
Define a small **`sendEmail` port** (e.g. `sendEmail({ to, from, subject, html, text,
replyTo, headers })`) and implement interchangeable adapters:

- **Console/stream stub** — logs the payload or writes an `.html`; dev/test (mirrors
  Nodemailer's stream/JSON transport). _This is what Phase 0 uses._
- **Nodemailer / SMTP** — "the most popular email library for Node.js," zero runtime
  deps, transports for SMTP (primary), SES, sendmail, stream. SMTP is universal —
  "almost every provider supports SMTP even when they advertise API sending," so one
  adapter reaches Postmark/SES/Mailgun via credentials alone. **This is the
  anti-lock-in default.**
- **Provider SDK** — Resend SDK / `@aws-sdk/client-ses(v2)` / Postmark — add only when
  you want that provider's richer features (webhooks, tagging, analytics).

Flow: `template → render() → { html, text } → sendEmail port → chosen adapter`.
Authoring never imports a provider; the provider is fully reversible by swapping one
adapter.

## Q3 — Provider evaluation (compliance-bound, self-host-leaning)

- **Lock-in / portability (weighted highest):** all candidates expose SMTP
  (`smtp.resend.com`, Postmark SMTP on paid tiers, SES SMTP interface at API price,
  SendGrid relay, Mailgun SMTP + EU endpoint). React Email (MIT) outputs plain HTML and
  is _not_ tied to Resend despite the shared maintainer. → lock-in is architectural,
  not provider-bound.
- **Deliverability:** **Postmark** leads for pure transactional (isolates transactional
  from bulk; polices shared IPs). **SES** gives the infra but makes deliverability
  _your_ job (IP warmup, DMARC alignment). **Self-hosted** is worst by default (weeks of
  warmup, perpetual blocklist fights). For auth mail (a lost reset = a blocked user),
  DIY deliverability is a real risk, mitigated by low auth volume + strict
  SPF/DKIM/DMARC.
- **Pricing:** **SES cheapest** ($0.10/1k, same via SMTP or API); **Resend** best free
  tier (3,000/mo); **Postmark** token free tier + pricey at volume (~$1.20–1.80/1k);
  **SendGrid** killed its permanent free plan; **Mailgun** usable plans ~$75–90/mo (+$10
  EU).
- **DX / TS:** **Resend** best-in-class (first-party TS SDK + native React Email);
  **Postmark** solid; **SES** verbose AWS SDK v3; SendGrid/Mailgun mature but less
  polished.
- **Compliance:** **SES strongest** — SOC 1/2/3, ISO 27001, HIPAA BAA, **genuine EU data
  residency** (Frankfurt/Ireland). **Resend** SOC 2 Type II + DPA but stores account
  data/metadata/logs in the **US** (only the _sending_ region can be EU). **Postmark**
  DPA + SCCs but **US-only storage** (CLOUD Act exposure) — a hard blocker where EU
  residency is mandated. **Mailgun** true EU region (Germany). **SendGrid** SOC 2/GDPR
  but US-centric.

**Verdict:** **SES** uniquely satisfies our top three constraints (SMTP-native
portability, strongest compliance + EU residency, lowest cost) — accepting rawer DX +
DIY deliverability. **Postmark** is the deliverability/DX runner-up _if_ US-only storage
is acceptable. **Resend** is a defensible fast-start (SES underneath, SOC 2), with the
US-residency gap keeping it out of _primary_ for a compliance-bound product. All are
SMTP-swappable, so the choice stays fully reversible.

## Placement — the `packages/email` boundary

Structured exactly like `packages/db` ([0012](0012-data-layer-postgres-drizzle.md)):

- **`packages/email` is the _only_ package that imports a transport/SDK.** It exposes
  the `sendEmail` port + adapters + React Email templates; consumers depend on that
  surface, never on Nodemailer / a provider SDK directly. One-way dependency.
- **`packages/auth`** injects `sendEmail` into Better Auth's `sendResetPassword` /
  `sendVerificationEmail` callbacks; **future billing / notifications** reuse the same
  package.
- **Swap the provider inside `packages/email` → consumers untouched.** Same lock-in-free
  isolation philosophy as the data layer.

## Consequences

- The **provider is a deferred, reversible deploy-time choice** — we build the port +
  React Email + SMTP path now and pick SES/Resend/Postmark later by env config.
- **`packages/email` is the single email choke-point** — testable, provider-swappable.
- **Now:** a console-stub adapter (refines the auth plan's **D3**); **later** (UI
  phase): React Email templates + a real provider adapter.
- **Self-hosted SMTP is rejected as the default** on deliverability grounds; revisit only
  for a specific, justified need.
- A small **soft-lock-in** remains if we later adopt a provider's proprietary features
  (webhooks/analytics/suppression) — accept consciously, keep the SMTP adapter as the
  exit.

## Note — the `@react-email/components` npm-deprecation warning is a false alarm

Installing `@react-email/components` prints an npm **deprecation** warning
(`"Package no longer supported"`) — generic boilerplate, no named successor, and
**`1.0.12` is still the latest published version**. It is **not** abandoned: React
Email consolidated its packages into the unified **`react-email`** dev/CLI package
and added the deprecation to steer imports there. But `react-email`'s main entry
pulls **`prismjs` + `marked` + `tailwindcss`** into runtime bundles (no
`sideEffects: false`, no subpath exports — [resend/react-email#3556]), so it is
**dev tooling, not a runtime component source**; maintainers acknowledge the
deprecation messaging is premature and that **`@react-email/components` remains the
correct runtime import**.

**So our split is deliberately correct and must stay:** `packages/email` imports
components from **`@react-email/components`** (runtime dep) and depends on
**`react-email`** only as a **devDependency** for the local preview CLI
(`@react-email/ui` is its preview-UI companion, also dev-only). **Do not "fix" the
warning** by switching imports to `react-email` — that would drag the CLI's heavy
deps into the shipped bundle. Revisit if/when React Email ships tree-shakeable
subpath exports for `react-email` (tracked by #3556).

## Update — 2026-08-24: SMTP adapter implemented (Nodemailer); Resend as the first provider

The "console stub now / provider deferred" position above is now realized — a **Nodemailer/SMTP
adapter** lands as the production sender (env-selected); the console stub stays the dev/test default.

**Clarity (recorded — it caused confusion): Nodemailer and Resend are different _layers_, not
competitors.**

- **Nodemailer** — a Node **library in our code** that _sends_ mail over SMTP (v9, **MIT-0**, zero
  runtime deps, the Node de-facto). The **library is free**; it does not deliver mail.
- **Resend** — a delivery **service/provider** (inbox delivery, IP reputation, DKIM/SPF). Reached
  via its **SMTP endpoint** _or_ its API SDK. **Delivery is provider-priced** (Resend free tier
  ≈ thousands/mo).
- Sending is always "our client → a provider." Two client paths: **(A) Nodemailer/SMTP → any
  provider** (switch by env creds) vs **(B) a provider's SDK** (switch = rewrite the adapter).

**Decision — Path A (Nodemailer/SMTP), with Resend as the first provider.** Chosen for the repo's
goals — scalable, reusable, isolated, **portable**, compliance-ready, and flexible for the
separate-backend split (ADR 0017): one adapter serves every SMTP provider, so the provider stays a
**deploy-time env choice with zero code lock-in** (Resend now → SES for EU-residency/scale/cost
later, credentials only). Resend's **SDK (Path B) was evaluated and rejected as the default** — its
extras (webhooks/batch) are marginal for transactional auth mail, its webhooks work over SMTP
anyway, and it reintroduces the vendor lock-in the `sendEmail` port exists to avoid. The port keeps
a provider-SDK adapter available later _if_ a hard need (e.g. batch) appears. ("Fast-start DX" is
explicitly **not** a deciding factor — AGENTS.md, "Build for the enterprise.")

**Official-docs best practices baked into the adapter** (nodemailer.com; resend.com/docs/send-with-smtp):

- **One pooled transporter, created lazily and reused** (`pool: true` + `maxConnections`/
  `maxMessages`) — never per-message (explicit Nodemailer guidance); lazy init keeps `next build`
  credential-free (ADR 0013).
- **Security by port:** 465/2465 → `secure: true` (implicit TLS); 25/587/2587 → STARTTLS
  (`secure: false`). TLS cert validation stays **on** (never `rejectUnauthorized: false`);
  `disableFileAccess`/`disableUrlAccess: true` (we only send pre-rendered HTML — no fs/URL fetches).
- **`EMAIL_FROM`** default; `replyTo`/`headers` passed through from the `EmailMessage`.
- Resend SMTP endpoint: `smtp.resend.com`, user `resend`, pass = API key, port 465.

**Env (validated; all optional so dev + no-secret CI build still work — ADR 0013):** `SMTP_HOST`,
`SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. Selection: SMTP when
`SMTP_HOST` is set, else the console stub.

## Revisit triggers

- **Outlook-desktop-heavy B2B** becomes primary → evaluate **MJML** for templates.
- **Deploy time** → lock the provider (SES lean); wire the real adapter + DKIM/SPF/DMARC.
- **EU data-residency** requirement firms up → SES (EU region) or Mailgun EU; rules out
  Postmark's US-only storage.
- **Deliverability** problems on SES → switch to **Postmark** (one adapter/env swap).

## Sources

**Authoring & sending libraries**

- React Email — <https://react.email/docs/introduction>, <https://react.email/docs/utilities/render>, <https://react.email/docs/cli>, <https://react.email/docs/integrations/nodemailer>
- `@react-email/components` deprecation is misleading / runtime-bundle weight of the unified `react-email` package — <https://github.com/resend/react-email/issues/3556>
- Nodemailer — <https://nodemailer.com/>, <https://nodemailer.com/smtp>, <https://nodemailer.com/transports>, <https://nodemailer.com/transports/ses>
- Comparisons — <https://www.pkgpulse.com/guides/react-email-vs-mjml-vs-maizzle-email-template-2026>, <https://www.pkgpulse.com/guides/best-email-libraries-nodejs-2026>, <https://trybuildpilot.com/688-react-email-vs-mjml-vs-maizzle-2026>

**Providers — deliverability, pricing, compliance**

- Resend — <https://resend.com/docs/dashboard/domains/regions>, <https://resend.com/changelog/multi-region-for-everyone>, <https://resend.com/security/gdpr>, <https://resend.com/security/soc-2>, <https://resend.com/legal/dpa>
- Postmark — <https://postmarkapp.com/pricing>, <https://postmarkapp.com/security>, <https://postmarkapp.com/eu-privacy>, <https://postmarkapp.com/dpa>, <https://postmarkapp.com/support/article/1218-gdpr-faq>
- Amazon SES — <https://aws.amazon.com/ses/pricing/>, <https://www.paubox.com/blog/amazon-ses-hipaa-compliant>
- Mailgun (EU) — <https://www.mailgun.com/compare/amazon-ses-alternatives/>, <https://www.aotsend.com/blog/p11807.html>
- SendGrid — <https://www.sendx.io/blog/sendgrid-pricing>, <https://www.saaspricepulse.com/tools/sendgrid>
- Self-hosting deliverability — <https://www.coinerella.com/dont-host-email-yourself-your-reminder-in-2026/>, <https://powerdmarc.com/self-hosting-email/>
- Provider comparisons — <https://www.hirenodejs.com/blog/nodejs-email-resend-postmark-ses-2026>, <https://www.buildmvpfast.com/blog/resend-vs-ses-vs-postmark-transactional-email-deliverability-saas-2026>, <https://emailsendx.com/blog/amazon-ses-vs-sendgrid-vs-mailgun-vs-postmark-2026>, <https://www.buildmvpfast.com/api-costs/email>

See [0011](0011-authentication-strategy.md) (auth — the first consumer),
[0012](0012-data-layer-postgres-drizzle.md) (the isolation-boundary pattern),
[../references.md](../references.md), and
[../future-improvements.md](../future-improvements.md).
