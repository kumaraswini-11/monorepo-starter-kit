# 0023. App shell, routing, state & route boundaries

- **Status:** Accepted
- **Date:** 2026-08-15 (routing, data-fetching, state, proxy — architecture R&D); 2026-08-26 (app-shell route boundaries)

> **Status: Accepted.** Recorded as _Proposed_ during the front-end architecture R&D pass
> (2026-08-15) while the backend was undecided; the premise is now resolved — **Next.js
> fullstack now**, with the `lib/` seam + a separate-backend migration playbook
> ([0017](0017-backend-architecture-and-migration.md)) — and the app-shell route boundaries
> were decided and implemented (2026-08-26). Forms (old §2) are now
> [0022](0022-forms-rhf-submission-and-pending.md).

## Context

Before building the auth UI, we ran a full ("god-mode") R&D pass on the **front-end
architecture**. The overriding constraint was that **the backend was undecided**: this repo
may stay **Next.js fullstack** _or_ grow a **separate backend** (Node / Express / NestJS /
FastAPI), **REST or GraphQL**, and is intended to be **reused as a template** across future
projects.

So every decision here is held to one bar:

> **Build the complete UI _wiring-agnostic_ now → decide the backend later → wire it up with
> _no UI rewrite_.**

…while respecting the repo ethos: minimal, evidence-backed, **no premature abstraction** and
**no vendor/framework lock-in**.

Cross-references: [0019](0019-nextjs-rendering-and-performance.md) (rendering model / React 19
form idiom — **refined here**), [0021](0021-base-ui-selection-and-adoption.md) (the forms
deferral — **resolved in [0022](0022-forms-rhf-submission-and-pending.md)**),
[0011](0011-authentication-strategy.md) (auth wiring),
[0013](0013-env-and-secrets-management.md) (the "decide-now, adopt-at-trigger" pattern).

The authenticated area is a persistent **app shell** — a `SidebarProvider` + `Sidebar` +
`SidebarInset` layout ([0020](0020-ui-foundations-layout-responsiveness-accessibility.md))
under the `app/(app)/` route group, with pages routed beneath it (§1 Routing, this ADR).
Next.js gives every route segment three built-in state files — `loading.tsx`, `error.tsx`,
`not-found.tsx` — and the question recurs for **every** authed segment: _where_ do those
boundaries live, _what_ do they render, and how do they stay accessible and consistent with
the shell? Concretely, four sub-questions drove that part:

1. What element should the segment **loading** fallback render, given the shell already
   provides page structure?
2. Where should an **error boundary** sit so a content failure doesn't destroy the shell?
3. Where does the **session guard** run — in the layout, or in each page?
4. Do we add a segment **`not-found`** now?

## R&D — route boundaries & states (what the sources say)

**Next.js (official docs + file conventions)**

- `error.js` **wraps a route segment and its nested children** in a React Error Boundary;
  errors **propagate to the closest parent boundary**, so "strategically placing `error.tsx`
  at various levels" is the documented pattern. An `error.js` does **not** catch its **own**
  segment's `layout.js` — the layout wraps the error boundary, so it survives (to catch a
  layout's error you place `error.tsx` in the **parent**).
- `not-found.js` renders only when **`notFound()` is thrown** within a segment; it is **not
  triggered by real crashes**. The **root** `app/not-found.js` handles **all unmatched URLs**.
- `loading.js` is the Suspense fallback for a segment's **page** (and children below it), is
  **shared by all pages in the same segment**, and wraps the page — **not** the segment's own
  layout (which runs above the boundary).

**UX**

- Prefer **skeletons over spinners**, and the skeleton should **match the real layout** — a
  spinner conveys nothing about what is loading.
- Error / 404 screens should **retain navigation** and offer a clear **recovery action**.

**Our own conventions**

- [0020](0020-ui-foundations-layout-responsiveness-accessibility.md): **a single `<main>` per
  page**, plus `<header>`/`<nav>`/`<footer>` landmarks — the a11y skeleton shadcn leaves to us.

## Decision

### 1. Routing — `/auth/*` namespace, `(app)` group, `/` dispatcher

- **`/`** is a **dispatcher** (signed-in → `/dashboard`, else → `/auth`) — no UI; keeps `/`
  free for a future marketing home.
- **`/auth/*`** is a real folder (a segment we _want_) with its own layout: `/auth` (entry) →
  `/auth/email` → `/auth/sign-in` | `/auth/sign-up`, plus `/auth/forgot-password` and
  `/auth/reset-password`.
- **`(app)`** is a route group (no URL segment) for the authed area (`/dashboard`), guarded by
  a server session check ([0019](0019-nextjs-rendering-and-performance.md) `instant = false`;
  the guard lives in `(app)/layout.tsx` — see §6 #3).
- **Identifier-first credential routes:** the email step decides the branch and routes to
  `/auth/sign-in` (existing) or `/auth/sign-up` (new) — dedicated, single-responsibility
  routes, **not** a mode-toggled single page (spec §2 "branching happens server-side; UI only
  reacts"; the Google/Auth0/WorkOS pattern). No manual sign-in/sign-up toggle; to switch, the
  user changes the email (Back / "Change").
- **Post-auth redirects (R&D-backed):** sign-up → **auto-login → `/dashboard`**; password
  reset → **sign in** (not auto-login — sessions are revoked on reset,
  [0011](0011-authentication-strategy.md)). See `../future-improvements.md`.
- **Not `(public)` / `(protected)`:** authorization is the guard's job, not a folder name —
  naming by access conflates routing with authz and breaks for semi-public routes.

### 2. Forms — React Hook Form + zod, presentational → [0022]

Extracted to [0022](0022-forms-rhf-submission-and-pending.md) (forms — RHF + zod, submission &
pending-state): presentational components with an **injected `onSubmit`** (the lock-in
breaker), `useController` on Base UI primitives, `root.serverError` + safe `FormSubmitError`,
and the reusable `components/form` layer now in `@workspace/ui`.

### 3. Client data-fetching — TanStack Query over Server Actions

- **TanStack Query** is a **backend-agnostic** client data layer (caching, mutations,
  revalidation, retries) that talks to Next route handlers **or** a separate REST / GraphQL
  backend — decoupling the UI from the backend choice.
- **Server Actions** are Next-fullstack-only; using them as the data layer would lock the
  frontend. Keep them available **only if** we commit to fullstack.
- **Not a replacement for server-side reads:** RSC / server-component data-fetching (per
  [0019](0019-nextjs-rendering-and-performance.md)) still applies for static / server-rendered
  reads. **TanStack Query is for client-side, interactive data.**

### 4. State management — server-state + URL + local + minimal global; **not Redux**

- **Server state → TanStack Query** (§3). Do **not** mirror it into a global store.
- **URL state** (filters, tabs, pagination, current entity) → **search params** (shareable,
  bookmarkable, no library).
- **Local / ephemeral UI state** → `useState` / React Context.
- **Genuinely global client state** (rare) → **Zustand** (tiny, unopinionated, no boilerplate)
  — adopt **only** when a real need appears.
- **Not Redux:** heavy boilerplate; its historical server-cache role is now TanStack Query's;
  overkill for this app. Redux Toolkit remains a fallback only if a future app needs complex,
  tightly-coupled global state — unlikely.
- **Applied — the multi-step auth flow.** The email is carried from `/auth/email` to the
  credential step (`/auth/sign-in` | `/auth/sign-up`) in an **in-memory React Context**
  (`AuthFlowProvider`, mounted in the `/auth` layout), **never the URL** — a query string
  would leak PII into logs, history, and `Referer` (compliance). It resets on reload **by
  design**: credential entry **restarts, it does not resume** — the credential step guards on
  the email and returns to `/auth/email` when it's absent. Resume is reserved for token-carried
  flows (magic link, verify) and server-persisted **post-signup onboarding** (a later,
  separate flow). This is why Context (auto-scoped, auto-reset) beats a global Zustand store
  here. Detail lives in the `auth-flow-provider` / `password-step` comments and the
  [auth-ui-ux spec](../specs/auth-ui-ux-spec.md).

### 5. `proxy.ts` (Next 16 rename of Middleware) — optional, not now

- Next.js guidance: the proxy does **optimistic** checks only (e.g. redirect when the session
  cookie is absent) and is **never the security boundary** — the real gate is the `(app)`
  layout guard + server session check
  ([0019](0019-nextjs-rendering-and-performance.md)'s `instant = false`; see §6 #3).
- We **don't need it yet**; the layout guard suffices. Add `proxy.ts` later purely for
  edge-level redirects / optimizations.

### 6. Route boundaries — loading, error, session guard & not-found

The `(app)` shell owns the page's single `<main>` (`SidebarInset`), so every boundary rendered
**inside** the shell is content, not a landmark:

1. **`(app)/loading.tsx`** — renders a **`<div role="status" aria-busy>`** with an `sr-only`
   "Loading…" label (never a second `<main>`; the shell owns the one `<main>`, per
   [0020](0020-ui-foundations-layout-responsiveness-accessibility.md)). The skeleton **mirrors
   the final page's top-aligned shape** so it resolves with **no layout shift**. It covers a
   **page's** async work, **not** the session guard (see #3).
2. **`(app)/error.tsx`** — a Client-Component error boundary **scoped to the authed segment**.
   Because it renders **inside** the `(app)` layout, the **shell survives** — sidebar, header,
   and the account menu (sign-out) stay put, so a content failure never strands the user
   without navigation. It renders a **`<div>`, not `<main>`** (the shell already owns `<main>`;
   a second one would nest landmarks). Uses `retry` (stable in Next 16.3, supersedes
   `unstable_retry`). Copy is kept **consistent** with the root boundary — same message, the
   only difference is the wrapper element.
3. **Session guard stays in the layout.** `await getSession()` (redirect-before-bytes) lives in
   `(app)/layout.tsx`, **not** in each page. A layout guard protects **every** authed page
   uniformly (a new page inherits it — DRY **and** a security property: no page can forget to
   guard). `getSession()` is `cache()`-memoized, so a page re-reading it is free. The trade-off
   — the guard runs **above** the `loading.tsx` boundary, so during the (fast, memoized)
   session read the previous route stays visible rather than the skeleton — is accepted.
4. **No `(app)/not-found.tsx` yet.** A segment `not-found` fires only on an explicit
   `notFound()`, which no authed page currently calls; unmatched URLs go to the **root**
   `not-found`. Adding one now would be dead code. **Add it when a page actually calls
   `notFound()`**, and render it as a **`<div>` inside the shell** (same rationale as #2).

**Cross-cutting rules this encodes** (building on
[0020](0020-ui-foundations-layout-responsiveness-accessibility.md)): exactly one `<main>` per
rendered page; primary navigation wrapped in `<nav aria-label>`; the active nav link marked
`aria-current="page"`; skeletons mirror the final layout.

### 7. Guiding principle — wiring-agnostic UI (the through-line)

Build the **complete** UI now against **seams**, not a chosen backend:

- **Presentational forms** with injected submit handlers (§2 →
  [0022](0022-forms-rhf-submission-and-pending.md)).
- A **`lib/` data-access seam** — a thin module the UI calls, swappable between the Better-Auth
  browser client (fullstack) and an API client (separate backend).
- **TanStack Query** for client data (§3).

Then the fullstack-vs-separate-backend decision changes only the **seam implementations**, not
the UI.

## Options considered (route boundaries)

| Question                 | Options                                                 | Chosen  | Why                                                                                                   |
| ------------------------ | ------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| Error boundary location  | (a) root only; (b) **scoped to `(app)`**                | **(b)** | keeps the shell (nav + sign-out) alive on a content error; root-only replaces everything              |
| Loading fallback element | (a) a second `<main>`; (b) **`<div role="status">`**    | **(b)** | one `<main>` per page (0020); `role="status"` + `sr-only` announces the state                         |
| Session-guard location   | (a) **in the layout**; (b) per page + stream a fallback | **(a)** | uniform guard for every page (DRY + security); guard-in-page is easy to forget; read is memoized/fast |
| `(app)/not-found.tsx`    | (a) add now; (b) **defer**                              | **(b)** | fires only on `notFound()`, which nothing calls yet — would be dead code; root handles unmatched URLs |

## Adoption triggers (nothing installed for the wiring layer today)

- **React Hook Form** → ✅ **installed 2026-08-16** for the auth flow (the first non-trivial
  form) — resolves the [0021](0021-base-ui-selection-and-adoption.md) forms deferral. See
  [0022](0022-forms-rhf-submission-and-pending.md).
- **TanStack Query** → install at the **first client-side data read/mutation**.
- **Zustand** → **only** when genuinely-global client state appears.
- **`proxy.ts`** → when edge-level optimistic redirects are worth it.

This mirrors [0013](0013-env-and-secrets-management.md)'s decide-now / adopt-at-trigger
approach: the direction is locked, the dependency lands when the need is real.

## Consequences

- The auth UI is built **presentational + wiring-agnostic**; the current directly-wired
  sign-in form and guard get refactored to **injected handlers** + the `lib/` seam.
- [0019](0019-nextjs-rendering-and-performance.md) §2's `useActionState` note is **refined**:
  it is the _fullstack_ option, not the default wiring.
- **No backend lock-in** — the template can target Next-fullstack or a separate backend (REST
  or GraphQL) without reworking the UI.
- The shell is **resilient**: a page error or slow load degrades the **content pane only** —
  navigation and sign-out remain reachable, which matters most in an authed product.
- The three states are **consistent and accessible** across every authed segment, with no
  duplicated `<main>` and no layout shift.
- One residual trade-off (§6 #3): the session-guard blocking is **not** covered by the skeleton
  (the previous route shows during it). Acceptable given the memoized, fast read; revisit only
  if the guard becomes slow (e.g. move to a streamed child boundary).
- The root and `(app)` error boundaries share **copy but not code** (each must be its own
  default-exported boundary file). The ~8-line overlap is inherent to per-segment boundaries;
  extract a shared presentational `ErrorState` **only when a third boundary appears** (rule of
  three).

## Revisit / finalize triggers

- **Finalized (Proposed → Accepted):** the wiring-agnostic approach is confirmed.
- **Backend decided (fullstack vs separate)** → **resolved in
  [0017](0017-backend-architecture-and-migration.md): Next.js fullstack now**, with the `lib/`
  seam + a separate-backend migration playbook. Server Actions / `useActionState`
  ([0019](0019-nextjs-rendering-and-performance.md) §2) become available (fullstack) but are
  intentionally **not** adopted — the seam keeps the injected browser-client handler portable.
- **GraphQL chosen** → TanStack Query pairs with a typed GraphQL client (e.g. graphql-request
  / urql) behind the same data seam.

## Sources

- Official docs (gathered during the R&D pass, via context7 / vendor sites): **TanStack
  Query**, **React Hook Form**, **Zustand**, Next.js **Proxy (Middleware)**, React 19
  **Actions / `useActionState`**.
- Next.js — [error.js file convention][next-error] · [not-found.js][next-notfound] ·
  [loading.js][next-loading] · [Error Handling guide][next-error-guide]
- [Builder.io — Next.js App Router files][builder]
- [Devya — what each App Router error file actually catches][devya]
- [UXPin — 404 page best practices][uxpin]
- [OneThing — skeleton screens vs spinners][onething]
- [NDLab — loading, error & empty states][ndlab]
- Related ADRs: [0019](0019-nextjs-rendering-and-performance.md),
  [0021](0021-base-ui-selection-and-adoption.md), [0011](0011-authentication-strategy.md),
  [0013](0013-env-and-secrets-management.md).

[next-error]: https://nextjs.org/docs/app/api-reference/file-conventions/error
[next-notfound]: https://nextjs.org/docs/app/api-reference/file-conventions/not-found
[next-loading]: https://nextjs.org/docs/app/api-reference/file-conventions/loading
[next-error-guide]: https://nextjs.org/docs/app/getting-started/error-handling
[builder]: https://www.builder.io/blog/nextjs-app-router-files
[devya]: https://www.devya.dev/blogs/nextjs-app-router-error-handling-field-notes
[uxpin]: https://www.uxpin.com/studio/blog/404-page-best-practices/
[onething]: https://www.onething.design/post/skeleton-screens-vs-loading-spinners
[ndlab]: https://ndlab.blog/posts/part2-4-ux-state-loading-error-empty

## See also

- [0022](0022-forms-rhf-submission-and-pending.md) — forms (RHF + zod, submission &
  pending-state); the app's presentational forms sit in this shell (originated as this ADR's
  old §2).
- [0020](0020-ui-foundations-layout-responsiveness-accessibility.md) — UI foundations; the
  single-`<main>` + landmarks conventions the boundaries apply, and the "Further UI
  conventions" (control sizing, action-color semantics) surfaced in the same app-shell review.
- [0019](0019-nextjs-rendering-and-performance.md) — rendering/streaming model behind the
  Suspense (`loading.tsx`) boundary, and the React 19 form idiom refined here.
- [0017](0017-backend-architecture-and-migration.md) — the backend decision (fullstack now)
  that resolves this ADR's premise, with the `lib/` seam + migration playbook.
- [0011](0011-authentication-strategy.md) — the auth wiring the routing and session guard serve.
