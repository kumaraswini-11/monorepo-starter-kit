# 0027. Backend architecture — Next.js fullstack now, separate-backend migration path

- **Status:** Accepted
- **Date:** 2026-08-16

> Resolves the fullstack-vs-separate-backend decision that
> [0025](0025-frontend-architecture-forms-data-state-routing.md) deliberately deferred. This
> ADR is both the **decision record** and the **wiring + migration playbook** — written
> _before_ wiring so the seam is built to move cheaply, and so a future migration is a
> lookup, not a re-investigation.

## Context

The auth **UI** is complete and **presentational** (forms take an injected `onSubmit`, ADR
0025), and the Better Auth **server** already exists and is **framework-neutral**. What's
left is to **wire** the UI to auth. That forces the question ADR 0025 parked: does auth (and
the API generally) run **inside Next.js** (fullstack) or in a **separate backend service**?

Constraint recap (ADR 0016 / 0025): enterprise, compliance-bound, **reusable as a template**,
**no vendor/framework lock-in**, minimal / no premature abstraction.

## Current state (what already exists)

| Piece          | File                                                                | Note                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth core      | `packages/auth/src/auth.ts`                                         | **Framework-neutral** `betterAuth(...)` — email/password, verification, reset + password-changed + new-device emails, sessions, telemetry off. Imports **no** framework code. |
| Next glue      | `apps/web/app/api/auth/[...all]/route.ts`                           | `toNextJsHandler(auth)` — the **only** Next-specific line.                                                                                                                    |
| Browser client | `apps/web/lib/auth-client.ts`                                       | Re-exports `authClient`; `baseURL` repointable in one place.                                                                                                                  |
| Server session | `apps/web/lib/session.ts`                                           | `cache(() => auth.api.getSession({ headers }))`.                                                                                                                              |
| Guards         | `app/(app)/layout.tsx`, `app/page.tsx`                              | `getSession()` + redirect (`instant = false`).                                                                                                                                |
| Data / email   | `packages/db` (Drizzle + Postgres), `packages/email` (console stub) | Own the schema + delivery port.                                                                                                                                               |
| UI             | `packages/ui/components/form/*`, `apps/web/components/auth/*`       | Presentational forms + step wrappers with injected `onSubmit`.                                                                                                                |

**Implication:** "do the backend" ≈ **wire the UI to auth that already exists**, not build a
backend. The server is ~done; the gap is the client-side wiring + runtime (DB/env/migrations).

## R&D & findings

- **Fullstack (Next route handlers / actions)** excels for rapid development, single-client
  products, and small/medium teams — one codebase, one deploy, one toolchain. **Separate
  backend** earns its cost with a **2nd non-web client** (mobile / public API / 3rd-party), a
  **dedicated or polyglot backend team**, or **heavy non-HTTP work** (queues, video, batch,
  WebSockets at scale). ([Coders Blog], [dev.to: API in Next vs separate].)
- **Enterprise monorepos use both.** The common shape is **Next fullstack until a trigger**,
  then split a dedicated **Node / NestJS / Fastify** service out, sharing `db` + `ui` packages.
  NestJS is the "serious production-grade" pick **when you actually need a service tier**.
  ([enterprise monorepo 2026], [best backend frameworks 2026].)
- **Better Auth is framework-neutral by design:** the **same** instance is mounted with
  `toNextJsHandler` (Next) **or** `toNodeHandler` (Node/Express) — which is exactly how
  `packages/auth` is already written.

## Decision

**Next.js fullstack now.** Wire the presentational UI to the existing Better Auth via the
Next route handler + browser client. Keep `packages/auth` framework-neutral and route every
auth call through a **thin app-side seam** so a future split is a transport swap, not a
rewrite.

### Why (held to the constraints)

- **Right-sized + already 90% there** — route handler + framework-neutral auth exist; one
  client (web); no separate-backend trigger yet. A service tier now is **premature abstraction**.
- **Template-friendly** — one deployable, **no CORS / cross-origin-cookie** setup; works out
  of the box for anyone cloning it.
- **Enterprise-valid** — Next fullstack is a mainstream production pattern, not a downgrade.
- **Not a lock-in** — the framework-neutral core + presentational UI make the migration
  contained (see the playbook below), so choosing fullstack now costs little later.

### Migration triggers (revisit this ADR when any becomes true)

A 2nd non-web client needs the same auth/API · a dedicated/polyglot backend team or stack ·
heavy background / async / WebSocket workloads · a compliance boundary isolating API + DB
from the web tier.

## Fullstack wiring — the plan (the "to-do")

Built as **layers**, each with one responsibility, so only the transport layer changes on a
migration:

```
UI (presentational)         packages/ui/components/form/*  ·  apps/web/components/auth/*(forms)
   ▲ injected onSubmit
Feature wiring (thin)       apps/web/components/auth/*-step.tsx   (guard, nav, inject)
   ▲ calls
Data-access seam  ◄── SWAP  apps/web/lib/auth/*                  (the ONLY module that knows the transport)
   ▲ uses
Transport         ◄── SWAP  apps/web/lib/auth-client.ts  +  app/api/auth/[...all]/route.ts
   ▲ mounts
Core (neutral)              packages/auth  ·  packages/db  ·  packages/email   (UNCHANGED on migration)
```

### 1. The seam — `apps/web/lib/auth/` (the swap point)

One module owns every auth transport call and error-maps it; nothing above it imports
`authClient` directly. `authClient` returns `{ data, error }` (it does **not** throw), so the
seam converts a returned `error` into a **`FormSubmitError`** (user-safe copy) that the
shared `submitWithFormError` renders in the `FormError` banner (ADR 0026 / 0025 §2).

```
// apps/web/lib/auth/actions.ts   (illustrative shape, not final code)
signInWithEmail(email, password): Promise<void>          // authClient.signIn.email → throw FormSubmitError on error
signUpWithEmail({ email, name, password }): Promise<void>// authClient.signUp.email
requestPasswordReset(email): Promise<void>               // authClient.forgetPassword({ email, redirectTo: "/auth/reset-password" })
resetPassword(token, newPassword): Promise<void>         // authClient.resetPassword
resolveAuthRoute(email): Promise<"sign-in" | "sign-up">  // identifier-first branch (see §3)
```

Server-side session reads stay in `lib/session.ts` (already `cache()`d). **Rule:** UI/feature
layers call the seam; only the seam + `lib/auth-client.ts` name the transport.

### 2. Inject into the steps (feature wiring)

The step wrappers supply the seam functions as the forms' `onSubmit`, then navigate:

- `EmailStep` → `resolveAuthRoute(email)` → `router.push("/auth/sign-in" | "/auth/sign-up")`.
- `SignInStep` → `signInWithEmail(email, password)` → `/dashboard`.
- `SignUpStep` → `signUpWithEmail(...)` → auto-login → `/dashboard`.
- `ForgotPasswordStep` → `requestPasswordReset(email)` (UI already enumeration-safe).
- `ResetPasswordStep` → `resetPassword(token, newPassword)` → toast → `/auth/sign-in`.
- `SignOutButton` → `authClient.signOut()` (already present).

The **forms/`packages/ui` do not change** — they already accept `onSubmit` (ADR 0025).

### 3. The one nuance — identifier-first existence check

Better Auth is **enumeration-safe** and exposes **no "does this email exist"** endpoint.
Identifier-first (routing to sign-in vs sign-up) **inherently reveals existence** — the
Google/Auth0/WorkOS model, normally **rate-limited**. Plan: a small, **rate-limited** check
behind `packages/db` (add a `getUserByEmail` query next to the existing `getUserById`),
exposed via a Next route handler or server action and called only from `resolveAuthRoute`.
**Forgot-password stays fully enumeration-safe** ("check your inbox" regardless); only the
sign-in/up branch reveals existence, by design.

### 4. Runtime (already scaffolded — just needs to run)

- **Postgres** via `docker-compose`; **env** from `.env.example` (`BETTER_AUTH_SECRET`,
  `DATABASE_URL`, `BETTER_AUTH_URL`) validated by `@workspace/env` (ADR 0021); **migrations**
  via drizzle-kit (ADR 0019). **Email** stays the console stub (ADR 0020) until a provider is
  chosen — no code change to switch, just the adapter.
- `nextCookies()` plugin is **only** needed if we call auth from **Server Actions**; we call
  it via the **browser client → route handler**, so it is not required (note it if we ever add
  server-action auth).

### Principles the wiring must follow (so the migration stays cheap)

- **Separation of concerns / SRP:** UI = presentation only; steps = guard + nav + inject;
  seam = transport + error-mapping; core = framework-neutral. No layer reaches past the next.
- **DRY:** the `{ error } → FormSubmitError` mapping and the auth calls live **once**, in the
  seam. Enumeration-safe copy is defined in one place.
- **Reusable / OCP:** the seam's function signatures are the contract; swapping the transport
  under them changes no caller (steps/forms untouched).
- **Next.js structure:** route handlers under `app/api/*`; server reads via `lib/session`
  (RSC + `cache()`); client mutations via the seam; guards in layouts (`instant = false`,
  ADR 0023). No business logic in components.

## Migration path → separate backend (in depth, for later)

Because the core is framework-neutral and the UI is presentational, a split is a
**transport/deploy change**, not an app rewrite.

### What changes

1. **New `apps/api`** (Express / Fastify / NestJS) that imports the **same** `@workspace/auth`
   and mounts it — the whole handler is essentially:
   ```
   import { toNodeHandler } from "better-auth/node";
   import { auth } from "@workspace/auth";
   app.all("/api/auth/*", toNodeHandler(auth));   // + server bootstrap, CORS (below)
   ```
   It depends on `@workspace/auth` + `@workspace/db` (+ `@workspace/env`) — the same packages.
2. **Repoint the client** — `lib/auth-client.ts`: `createAuthClient({ baseURL: env.API_URL })`.
   **One line** (the file already anticipates this).
3. **CORS + cross-origin cookies** — set Better Auth `trustedOrigins` to the web origin(s),
   enable CORS on `apps/api`, and configure cookies for cross-site (`sameSite`, cookie
   domain, `useSecureCookies`). Config only.
4. **Server session reads** (`lib/session.ts`) — in fullstack the web reads the session
   directly (it has the auth package + DB). In a true split the web tier should **not** hold
   DB creds, so `getSession` becomes an **HTTP call to the API** (or a shared, DB-less session
   verification). This is the one file with real logic to change (still small).
5. **Remove/So‑proxy** `apps/web/app/api/auth/[...all]/route.ts` (delete, or keep as a proxy).
6. **Deploy** — a 2nd service + its env/secrets/pipeline.

### What does **not** change

- `packages/auth` config, the Drizzle **schema**, `packages/db`, `packages/email`.
- The **seam's function signatures** (`signInWithEmail`, …) — callers untouched.
- **All auth UI** — forms, steps, `packages/ui` form layer: **zero** changes.

### Effort

Roughly a **day-ish**: a thin new service (~1 handler + bootstrap), a 1-line client repoint,
CORS/cookie config, and one `getSession` transport swap. **No UI rework.** That contained
cost is the entire point of the wiring-agnostic design (ADR 0025) + framework-neutral core
(ADR 0016).

## Consequences

- The auth flow becomes functional as **Next fullstack** with one deployable and no
  cross-origin complexity; the template runs out of the box.
- The seam (`lib/auth/`) is the single, documented swap point; a future service split follows
  this playbook without touching the UI.
- ADR 0025's "backend undecided" is resolved; its Server-Actions / `useActionState` note
  ([0023] §2) becomes available (fullstack) but is **not** adopted — we keep the injected
  browser-client handler so the seam stays portable.

## Sources

- [Coders Blog]: https://thecodersblog.com/nextjs-fullstack-vs-separate-backend-architecture-guide/
- [dev.to: API in Next vs separate]: https://dev.to/joy5k/best-practice-api-in-nextjs-vs-separate-backend-3gjg
- [enterprise monorepo 2026]: https://medium.com/@oxm/how-i-built-a-professional-full-stack-monorepo-with-next-js-node-js-and-pnpm-workspaces-2026-1b8f5ac66bf9
- [best backend frameworks 2026]: https://quartzdevs.com/resources/best-backend-frameworks-2026-top-server-side-tools
- Better Auth — `toNextJsHandler` / `toNodeHandler`, Next.js integration, `trustedOrigins`,
  cookies (via the `better-auth-best-practices` skill at implementation time).

## See also

- [0016](0016-authentication-strategy.md) — Better Auth chosen (self-hosted, framework-neutral,
  own DB).
- [0025 §2/§6](0025-frontend-architecture-forms-data-state-routing.md) — presentational forms,
  the `lib/` data-access seam, wiring-agnostic through-line.
- [0026](0026-form-submission-and-pending-state-pattern.md) — `FormSubmitError` /
  `root.serverError` contract the seam feeds.
- [0019](0019-data-layer-postgres-drizzle.md), [0020](0020-email-transactional-messaging.md),
  [0021](0021-env-and-secrets-management.md) — data / email / env the wiring depends on.
