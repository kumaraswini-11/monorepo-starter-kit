# 0025. Front-end architecture — forms, data-fetching, state & routing (wiring-agnostic)

- **Status:** Proposed
- **Date:** 2026-08-15

> **Proposed, not Accepted.** The R&D and recommendations below are recorded so the
> reasoning is not lost. Flip to **Accepted** once finalized. Nothing here is installed
> yet — these are decide-now / adopt-at-trigger decisions.

## Context

Before building the auth UI, we ran a full ("god-mode") R&D pass on the **front-end
architecture**. The overriding constraint is that **the backend is undecided**: this
repo may stay **Next.js fullstack** _or_ grow a **separate backend** (Node / Express /
NestJS / FastAPI), **REST or GraphQL**, and is intended to be **reused as a template**
across future projects.

So every decision here is held to one bar:

> **Build the complete UI _wiring-agnostic_ now → decide the backend later → wire it up
> with _no UI rewrite_.**

…while respecting the repo ethos: minimal, evidence-backed, **no premature abstraction**
and **no vendor/framework lock-in**.

Cross-references: [0023](0023-nextjs-rendering-and-performance-model.md) (rendering model
/ React 19 form idiom — **refined here**), [0014](0014-base-ui-adoption.md) (the forms
deferral — **resolved here**), [0016](0016-authentication-strategy.md) (auth wiring),
[0021](0021-env-and-secrets-management.md) (the "decide-now, adopt-at-trigger" pattern).

## Decisions (recommended)

### 1. Routing — `/auth/*` namespace, `(app)` group, `/` dispatcher

- **`/`** is a **dispatcher** (signed-in → `/dashboard`, else → `/auth`) — no UI; keeps
  `/` free for a future marketing home.
- **`/auth/*`** is a real folder (a segment we _want_) with its own layout:
  `/auth` (entry) → `/auth/email` → `/auth/sign-in` | `/auth/sign-up`, plus
  `/auth/forgot-password` and `/auth/reset-password`.
- **`(app)`** is a route group (no URL segment) for the authed area (`/dashboard`),
  guarded by a server session check ([0023] `instant = false`).
- **Identifier-first credential routes:** the email step decides the branch and routes to
  `/auth/sign-in` (existing) or `/auth/sign-up` (new) — dedicated, single-responsibility
  routes, **not** a mode-toggled single page (spec §2 "branching happens server-side; UI
  only reacts"; the Google/Auth0/WorkOS pattern). No manual sign-in/sign-up toggle; to
  switch, the user changes the email (Back / "Change").
- **Post-auth redirects (R&D-backed):** sign-up → **auto-login → `/dashboard`**; password
  reset → **sign in** (not auto-login — sessions are revoked on reset, [0016]). See
  `../future-improvements.md`.
- **Not `(public)` / `(protected)`:** authorization is the guard's job, not a folder name
  — naming by access conflates routing with authz and breaks for semi-public routes.

### 2. Forms — React Hook Form + zod, **presentational**

- **RHF + zod:** ecosystem default; uncontrolled (minimal re-renders); first-class zod
  resolver; purely **client-side** so a form can submit **anywhere**. `field.tsx`
  already consumes an errors array, and **`zod` already ships** in the repo (schemas
  shared client + server).
- **Presentational pattern (the lock-in breaker):** form components receive an
  **injected `onSubmit`** and know nothing about _where_ the data goes. The same
  `<SignInForm onSubmit={…}>` works with the Better Auth browser client (fullstack)
  **or** a `fetch` to a separate API — no rewrite when the backend is decided.
- **Rejected for the wiring layer:** `useActionState` + **Server Actions** — powerful,
  but **Next-fullstack-only**; wiring forms to them locks the frontend to
  Next-as-backend, contradicting the undecided-backend constraint. **TanStack Form** is
  promising but has a smaller ecosystem; RHF is the safer default.
- **Refines [0023] §2**, which (assuming fullstack) prescribed `useActionState`. That
  remains valid **if/when we commit to fullstack**; the **default wiring-agnostic form**
  is RHF + an injected handler.

### 3. Client data-fetching — TanStack Query over Server Actions

- **TanStack Query** is a **backend-agnostic** client data layer (caching, mutations,
  revalidation, retries) that talks to Next route handlers **or** a separate REST /
  GraphQL backend — decoupling the UI from the backend choice.
- **Server Actions** are Next-fullstack-only; using them as the data layer would lock
  the frontend. Keep them available **only if** we commit to fullstack.
- **Not a replacement for server-side reads:** RSC / server-component data-fetching
  (per [0023]) still applies for static / server-rendered reads. **TanStack Query is for
  client-side, interactive data.**

### 4. State management — server-state + URL + local + minimal global; **not Redux**

- **Server state → TanStack Query** (§3). Do **not** mirror it into a global store.
- **URL state** (filters, tabs, pagination, current entity) → **search params**
  (shareable, bookmarkable, no library).
- **Local / ephemeral UI state** → `useState` / React Context.
- **Genuinely global client state** (rare) → **Zustand** (tiny, unopinionated, no
  boilerplate) — adopt **only** when a real need appears.
- **Not Redux:** heavy boilerplate; its historical server-cache role is now TanStack
  Query's; overkill for this app. Redux Toolkit remains a fallback only if a future app
  needs complex, tightly-coupled global state — unlikely.
- **Applied — the multi-step auth flow.** The email is carried from `/auth/email` to
  `/auth/password` in an **in-memory React Context** (`AuthFlowProvider`, mounted in the
  `/auth` layout), **never the URL** — a query string would leak PII into logs, history,
  and `Referer` (compliance). It resets on reload **by design**: credential entry
  **restarts, it does not resume** — the password step guards on the email and returns to
  `/auth/email` when it's absent. Resume is reserved for token-carried flows (magic link,
  verify) and server-persisted **post-signup onboarding** (a later, separate flow). This
  is why Context (auto-scoped, auto-reset) beats a global Zustand store here. Detail lives
  in the `auth-flow-provider` / `password-step` comments and the
  [auth-ui-ux spec](../specs/auth-ui-ux-spec.md).

### 5. `proxy.ts` (Next 16 rename of Middleware) — optional, not now

- Next.js guidance: the proxy does **optimistic** checks only (e.g. redirect when the
  session cookie is absent) and is **never the security boundary** — the real gate is
  the `(app)` layout guard + server session check ([0023]'s `instant = false`).
- We **don't need it yet**; the layout guard suffices. Add `proxy.ts` later purely for
  edge-level redirects / optimizations.

### 6. Guiding principle — wiring-agnostic UI (the through-line)

Build the **complete** UI now against **seams**, not a chosen backend:

- **Presentational forms** with injected submit handlers (§2).
- A **`lib/` data-access seam** — a thin module the UI calls, swappable between the
  Better-Auth browser client (fullstack) and an API client (separate backend).
- **TanStack Query** for client data (§3).

Then the fullstack-vs-separate-backend decision changes only the **seam
implementations**, not the UI.

## Adoption triggers (nothing installed today)

- **React Hook Form** → install at the **first non-trivial form** (resolves the
  [0014](0014-base-ui-adoption.md) forms deferral).
- **TanStack Query** → install at the **first client-side data read/mutation**.
- **Zustand** → **only** when genuinely-global client state appears.
- **`proxy.ts`** → when edge-level optimistic redirects are worth it.

This mirrors [0021](0021-env-and-secrets-management.md)'s decide-now / adopt-at-trigger
approach: the direction is locked, the dependency lands when the need is real.

## Consequences

- The auth UI is built **presentational + wiring-agnostic**; the current directly-wired
  sign-in form and guard get refactored to **injected handlers** + the `lib/` seam.
- [0023](0023-nextjs-rendering-and-performance-model.md) §2's `useActionState` note is
  **refined**: it is the _fullstack_ option, not the default wiring.
- **No backend lock-in** — the template can target Next-fullstack or a separate backend
  (REST or GraphQL) without reworking the UI.

## Revisit / finalize triggers

- **Finalize** (Proposed → Accepted) once the approach is confirmed.
- **Backend decided (fullstack vs separate)** → implement the `lib/` seam accordingly;
  if fullstack, Server Actions / `useActionState` ([0023] §2) become available for
  progressive enhancement.
- **GraphQL chosen** → TanStack Query pairs with a typed GraphQL client (e.g.
  graphql-request / urql) behind the same data seam.

## Sources

- Official docs (gathered during the R&D pass, via context7 / vendor sites):
  **TanStack Query**, **React Hook Form**, **Zustand**, Next.js **Proxy (Middleware)**,
  React 19 **Actions / `useActionState`**.
- Related ADRs: [0023](0023-nextjs-rendering-and-performance-model.md),
  [0014](0014-base-ui-adoption.md), [0016](0016-authentication-strategy.md),
  [0021](0021-env-and-secrets-management.md).
