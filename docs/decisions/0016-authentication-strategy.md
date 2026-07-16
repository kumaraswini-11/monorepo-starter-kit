# 0016. Authentication strategy — adopt Better Auth (self-hosted), not roll-your-own

- **Status:** Accepted (strategy) — implementation is phased and **not yet started**
- **Date:** 2026-07-16

## Context

We are building an enterprise application intended to **scale to millions of
users** and to face **compliance** later. Authentication comes first;
authorization follows. The core question: **build the auth system manually, or
adopt a library — and if a library, which one?**

Before deciding, we scoped the three forks that actually change the answer:

| Question we asked                  | Answer for this product                                                                       | Why it mattered                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Who logs in?** (audience)        | **Hybrid** — B2C self-signup now, B2B enterprise customers later                              | Decides whether enterprise **SSO (SAML/OIDC) + SCIM** are a hard _future_ requirement (they are). |
| **Where does identity live?**      | **Own it in our DB (self-host)** — data residency / compliance                                | Rules out managed stores that hold users off-site; mandates a **self-hosted library**.            |
| **Which login methods at launch?** | Email+password, social OAuth, passwordless (magic link / OTP), passkeys; **MFA & more later** | Determines which tools can cover the whole method set **first-party**, not via bolt-ons.          |

### How we decided

Per the repo's methodology (see [0005](0005-follow-shadcn-baseline.md)), the
recommendation was produced by a multi-source, internet-wide research pass with
**adversarial fact-checking** (3-vote verification per claim). Every claim below
was **confirmed 3–0** against 2026 sources — primary maintainer announcements,
official docs, OWASP, and vendor pricing pages. Time-sensitivity is high; this
reflects the **July 2026** landscape.

## Options considered

| Option                                      | Type                | 2026 status (verified)                                                                                                                                       | Verdict                                                                                                                          |
| ------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Roll your own**                           | —                   | N/A                                                                                                                                                          | ❌ **Rejected** — security surface too large (below); OWASP prefers maintained defenses.                                         |
| **Lucia**                                   | library             | **Deprecated** — v3 EOL March 2025; repositioned to _"a learning resource on implementing auth from scratch"_ (maintainer's words)                           | ❌ Not a dependency.                                                                                                             |
| **Auth.js / NextAuth v5**                   | library (self-host) | **Frozen** — security-patch-only since Sept 2025; still **beta after 2+ years**; team **merged into Better Auth**, which they now recommend for new projects | ❌ Abandoned foundation.                                                                                                         |
| **Managed** (Clerk / Auth0 / WorkOS _core_) | hosted service      | Mature, best-in-class DX                                                                                                                                     | ❌ Store identity **off-site** → fails the self-host requirement. (WorkOS retained as an _optional SSO complement_ — see below.) |
| **Better Auth**                             | library (self-host) | **v1.6 (May 2026), active**; first-party plugins for every required method + org/SSO/SCIM                                                                    | ✅ **Chosen.**                                                                                                                   |

### Why not roll our own

The surface we would own forever: password hashing, session fixation/rotation,
CSRF, credential-stuffing defense, account recovery, rate limiting, and
**WebAuthn/passkey correctness** — each a place where one subtle bug exposes the
whole user base, and exactly what compliance auditors scrutinize. This is OWASP's
own position:

> "Built-in defenses are generally preferable because they're maintained by the
> framework authors and reduce the risk of subtle implementation mistakes."
> — OWASP CSRF Cheat Sheet

And the highest-value control — **MFA** — _"would have stopped 99.9% of account
compromises"_ (Microsoft, via OWASP). We adopt a maintained library and prioritize
MFA early rather than rebuild all of this.

## Decision

Adopt **[Better Auth](https://better-auth.com)** as the **self-hosted core** of the
auth system.

- **Self-hosted, data in our own DB.** It is an MIT-licensed TypeScript library that
  runs inside our app (Node runtime) — not a hosted service. Fits Next.js 16 App
  Router / React 19 Server Components.
- **All launch methods are first-party plugins:** email+password and social OAuth
  (core), **magic link**, **email OTP**, **passkeys** (WebAuthn), plus **2FA/TOTP**
  for the MFA phase — no third-party dependency for any of them.
- **Credible B2B path without a rewrite:** first-party **Organization**
  (orgs/teams/RBAC), **SSO** (SAML 2.0 + OIDC + OAuth2, linkable per-organization
  with auto-provisioning), **OIDC-Provider**, and **SCIM** plugins.
- **MIT license** — usable in our proprietary / `UNLICENSED` product (cf.
  [0001](0001-proprietary-license-unlicensed.md)); MIT deps like Next.js and React
  are already the norm here.

## Security & trust model

The key concern for a compliance-bound product — _can the library author see our
data?_ **No.**

- **Self-hosted.** User records, passwords, and sessions live in **our** database
  and are processed in **our** server process. There is **no Better Auth server in
  the auth path** — no network route for the author to see anything. (This is the
  concrete advantage over Clerk/Auth0/WorkOS, which hold identity off-site.)
- **Telemetry is opt-in and OFF by default** — and even when enabled collects **no
  PII**: their docs state _"We do not collect emails, usernames, tokens, secrets,
  client IDs, client secrets, or database URLs"_ and _"We never send your full
  betterAuth configuration."_ Hard kill-switch: `BETTER_AUTH_TELEMETRY=0`. (Notably
  stricter than Next.js, whose telemetry is opt-_out_.)
- **Open-source (MIT) → auditable.** Every line is reviewable — a plus over a closed
  hosted service for compliance.
- **Security defaults:** scrypt password hashing (memory-hard; swappable to
  argon2/bcrypt), multi-layered CSRF (Origin + `SameSite=Lax` + Fetch-Metadata),
  `httpOnly` secure session cookies with sliding renewal and per-device revocation.
- **The real risk is supply chain, not snooping.** Like _any_ server dependency, it
  runs with full access to credentials/DB, so a malicious/compromised _release_
  could do harm. This is the generic npm risk — **mitigated by controls already in
  this repo**: lockfile pinning, the `minimumReleaseAge` cooldown, review-before-
  upgrade, Dependabot/taze. Keep them.

## Authorization approach (the "later" phase)

Start simple, escalate only when forced:

- **Begin with Better Auth's Organization-plugin RBAC** (owner/admin/member + custom
  permissions) — covers most needs.
- **Graduate to a dedicated policy engine only** when fine-grained ABAC or
  relationship-based authz exceeds RBAC: **Cerbos** (policy-as-code ABAC) or
  **OpenFGA / SpiceDB** (Google-Zanzibar ReBAC). Do not build this on day one.
  _(This guidance is directional — the authz-engine research did not surface
  independently verified claims; revisit with dedicated research when the phase
  arrives.)_

## Phased adoption plan

1. **Now — Authentication.** Better Auth core + email/password + social OAuth +
   magic link/OTP + passkeys. Own the schema in our DB.
2. **Next — MFA.** Enable the 2FA/TOTP plugin.
3. **Then — Authorization.** Organization-plugin RBAC; add a policy engine only if
   complexity demands it.
4. **When B2B lands — Enterprise SSO/SCIM.** Better Auth SSO + SCIM plugins, **or**
   front the SSO phase with **WorkOS AuthKit** (free to 1M MAU, purpose-built for
   enterprise SSO) if time-to-market beats running a second system — accepting
   off-site storage for those SSO connections only, with Better Auth remaining the
   identity core.

## Consequences — risks & lock-in

- ⚠️ **SSO/SCIM are the newest, least-proven surface.** A **CVSS 9.6 SSRF
  (CVE-2026-53513)** hit the SSO plugin, and SCIM covers only a subset of SCIM 2.0.
  This is the phase where the WorkOS hybrid is worth reconsidering. (We do not
  install these plugins until Phase 4.)
- ⚠️ **No pre-built UI** — we build login/account screens ourselves (fine — we
  already have shadcn / Base UI, cf. [0007](0007-base-ui-over-radix.md),
  [0014](0014-base-ui-adoption.md)).
- ⚠️ **Limited public evidence of multi-million-user production scale.** Vendor docs
  are authoritative on _features_, not _scale_ — "scales to millions" is a reasonable
  inference, not a benchmark. **Load-test the session store** before betting a launch
  on it.
- **Lock-in / migration:** identity lives in our DB under a Better-Auth-defined
  schema. Moving off it, or adding WorkOS for SSO, means schema/session-format
  reconciliation. Manageable, but plan the schema with portability in mind.

## Sources (verified 3–0)

- Auth.js → Better Auth stewardship: <https://github.com/nextauthjs/next-auth/discussions/13252>, <https://better-auth.com/blog/authjs-joins-better-auth>
- Lucia deprecation: <https://github.com/lucia-auth/lucia/discussions/1714>, <https://lucia-auth.com/>
- Better Auth methods & B2B plugins: <https://better-auth.com/docs/plugins> (passkey, magic-link, email-otp, 2fa, organization, sso, scim)
- Better Auth security & telemetry: <https://better-auth.com/docs/reference/security>, <https://better-auth.com/docs/reference/telemetry>
- OWASP (roll-your-own / MFA): CSRF & Credential-Stuffing cheat sheets
- WorkOS pricing (free to 1M MAU): <https://workos.com/pricing>

See [../references.md](../references.md) and [../future-improvements.md](../future-improvements.md).
