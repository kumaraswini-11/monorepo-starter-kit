# 0032. Instant navigation, page transitions & route-guard placement

- **Status:** Proposed — page-transitions decision is settled (no code needed);
  the **route-guard revision is a recommendation pending decision + implementation**
- **Date:** 2026-09-07
- **Implementation:** none yet. §Page transitions endorses the status quo (instant
  navigation + `loading.tsx` skeletons — no code change). §Route protection **proposes**
  moving the auth guard out of `(app)/layout.tsx` into a Data Access Layer; that is a
  security-sensitive refactor, entangled with the dev-bypass in `lib/session.ts` and the
  pending `lib/session.ts` → `features/auth/lib/` move, so it is **sequenced with the
  pre-merge auth cleanup**, not done here. This ADR records the R&D so the decision isn't
  re-derived.

## Context

The question was "what's the best page-transition approach when navigating between
routes (e.g. `/dashboard` → `/settings`)?" Investigating it surfaced a second, linked
topic: Next 16.3's Cache Components **instant-navigation validation** fires a dev insight
(`instant-unrendered-segment`) for our authed pages. Both are the **same subsystem** —
Next 16's navigation model — so they're decided together here.

Our baseline: Next.js **16.3.4** App Router with `cacheComponents` (PPR/streaming),
`reactCompiler`, `typedRoutes` ([next.config.ts](../../apps/web/next.config.ts)). A
persistent `(app)` shell (sidebar + header in a _layout_) wraps `/dashboard` + `/settings`;
public `/auth` pages sit outside it. Each authed page streams under a segment `loading.tsx`.
No motion library (dependency-weight rule, [0016](0016-shared-code-and-package-boundaries.md)).
Enterprise, compliance-bound, template-reusable; **motion restraint** + accessibility-first
([0020](0020-ui-foundations-layout-responsiveness-accessibility.md)). Deep R&D preceded this
(official docs + enterprise-product observation + UX/a11y sources; full list in _Sources_).

## The reframe: for app chrome, the answer is _instant navigation_, not animation

Next 16.3's headline feature is literally **"Instant Navigations"** — its entire thesis is
that SPA-_feel_ comes from showing a shell **instantly** and streaming the rest (prefetch,
prefetched loading shells, `loading.tsx`), **not** from animating the route change. Route
animation addresses neither latency gap (client↔server, server compute); at best it masks
latency, at worst it **adds** delay before content appears, and during a View-Transitions
animation the new page is a non-interactive snapshot. NN/g: 0.1s already feels instantaneous
(no feedback needed), so a 200–400ms transition layered on already-instant navigation makes a
speed tool feel **slower**.

**The instant-navigation model (the levers):** the **static shell** (static + `"use cache"`
content) paints immediately; **`<Suspense>`** / **`loading.tsx`** cover subtrees that read
uncached data or runtime APIs (`cookies()`/`headers()` outside a boundary is a build error
under Cache Components); **prefetch** (16.3 caches a reusable per-route App Shell) makes warm
navigations instant; the **`instant` route-segment config** and
**`experimental.instantInsights.validationLevel`** tune validation. The validation runs in
**development only — it does not fail the production build** (Next's `instant` API reference:
_"Validates in development only… the build is unaffected"_).

## Decision 1 — Page transitions: keep instant navigation + skeletons (no route animation)

Do **nothing** to route navigation. Instant nav + layout-mirroring `loading.tsx` skeletons is
the framework's direction, the universal enterprise norm, the fastest perceived performance,
zero-dependency, and zero accessibility surface.

**What real enterprise apps ship (page-to-page):**

| Product                                       | Navigation                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Linear                                        | instant (<100ms); _removes_ animation where it lags input |
| Vercel dashboard / Next.js docs               | instant, prefetched shells; no route animation            |
| GitHub                                        | instant SPA nav + top progress; no crossfade/slide        |
| Stripe, Notion, Jira, Retool, Sentry, Datadog | instant + skeletons; no route-transition animation        |

Route-transition animations (slide/crossfade/shared-element) belong to **consumer / media /
e-commerce / mobile / marketing** surfaces (Next's own guide uses a _photo gallery_) — there
is **no peer precedent** for animating sibling-page navigation in a B2B shell.

**Reserved (do not build now):** a subtle **opacity-only** native React `<ViewTransition>`
crossfade — only if a genuine shared-element continuity case appears (e.g. a card/row →
detail hero). If ever added: wrap it in `(app)/**/page.tsx` (never the shell layout so the
sidebar/header stay anchored), keep it ≤200ms, set `::view-transition { pointer-events: none }`,
and gate it with an explicit `@media (prefers-reduced-motion: reduce)` block zeroing
`::view-transition-*` (React does **not** auto-disable, and a generic `* {transition:none}`
reset does **not** cover VT pseudo-elements). Note it rides React's **canary/experimental**
channel (usable in App Router without config since 16.3, but not stable React) — acceptable
only as graceful enhancement, never "wrap the whole app."

**Rejected:** `next-view-transitions` (redundant vs native + client dep + supply-chain
surface), manual `document.startViewTransition` (fights React 19 concurrent rendering /
streaming — snapshots the skeleton, not final content), and **Framer Motion / `motion`**
(heavy client runtime dep for a cosmetic effect, fights PPR/streaming + App-Router layout
persistence — direct dependency-weight violation).

**Accessibility:** route transitions are non-essential interaction motion → **WCAG 2.3.3
(AAA)** requires they be disable-able (positional slides carry the most vestibular risk;
opacity the least). Instant nav + skeletons has **no** motion surface. A single navigation is
nowhere near **2.3.1** (three flashes).

## Decision 2 (proposed) — Route protection: move the guard to a Data Access Layer

**Why this is on the table:** the dev insight's root cause is
[`(app)/layout.tsx`](<../../apps/web/app/(app)/layout.tsx>) doing
`await getSession()` → `if (!session) redirect("/auth")` **before rendering `{children}`** —
the documented anti-pattern (_"a layout that conditionally returns early without rendering
`{children}` … drops every segment in the subtree"_). More importantly, **Next now states a
layout guard is not a security boundary**: layouts don't gate child rendering, don't re-run on
client navigations, and don't protect the underlying data / Server Actions / the RSC payload.
So the current layout guard ([0023](0023-app-shell-routing-and-boundaries.md) §6 #3) is both
the cause of the insight **and** weaker than assumed.

**Proposed pattern (Next's + Better Auth's official recommendation):**

1. **Layout becomes pure chrome** — always renders `{children}`; session-dependent chrome
   (user menu, verify-email banner) moves under `<Suspense>` so the shell streams. This alone
   clears the `instant-unrendered-segment` insight for `/dashboard` and `/settings`.
2. **A Data Access Layer is the real guard** — promote [`lib/session.ts`](../../apps/web/lib/session.ts)
   into a `cache()`-memoized `verifySession()` / `getCurrentUser()` that reads the session,
   `redirect()`s when absent, returns a narrow DTO, and is called by **every** authed page's
   data read / Server Action / Route Handler. This keeps the "can't be forgotten" property
   ADR 0023 valued but relocates it **next to the data**, where Next says it belongs — and
   where it also covers Actions / Handlers / the RSC payload a layout guard never protected.
3. **`instant = false` stays only on the shell _layout_** (it legitimately reads `cookies()`
   for `sidebar_state` — the documented "ancestor isn't instant, descendants are" pattern);
   pages become instant-nav-valid. Per-page `instant = false` is a migration bridge only.
4. **Middleware / `proxy.ts` remains optional + optimistic-only** — Better Auth
   `getSessionCookie` for an edge redirect to avoid a flash of authed chrome, **never** the
   security boundary (it only checks cookie _existence_; CVE-2025-29927 showed middleware is
   bypassable). Consistent with [0023](0023-app-shell-routing-and-boundaries.md) §5.

**This would supersede [0023](0023-app-shell-routing-and-boundaries.md) §6 #3** ("session
guard stays in the layout"). Net effect: **clears the insight, strengthens security, restores
instant navigation, and aligns _better_ with [0017](0017-backend-architecture-and-migration.md)**
(the DAL is app-side `lib/`; `packages/auth` stays framework-neutral; `getSession`'s transport
is still the single swap point for a future backend split). Best fit for a template others
copy: the DAL makes the secure path the _only_ path (you can't load protected data without
authorizing), where a page-guard-by-hand is a forgettable footgun and a layout early-return
teaches a pattern Next now discourages.

**Sequencing:** the refactor touches `lib/session.ts`, which currently holds the **dev-bypass**
(uncommitted, must not ship) and is slated to move to `features/auth/lib/`. So implement the
DAL guard **together with the pre-merge auth cleanup** (remove bypass → move `session.ts` →
DAL guard), not on the bypass-laden file.

## Follow-ups (surfaced by the R&D)

- **Verify + likely enable partial prefetching** — the two research passes disagreed on
  whether 16.3 prefetches a per-route App Shell by default vs behind a flag; **verify against
  the installed 16.3.4 docs before touching `next.config.ts`**. This is the real "make
  navigation instant" lever — higher-leverage than any animation.
- **`instant()` Playwright assertion** (`@next/playwright`) — assert what's visible without
  waiting on the network, on hard loads + client navs, and lock instant-nav in CI
  ([0025](0025-testing-strategy.md)). Route animation has no equivalent objective gate.

## Consequences

- Navigation stays instant and honest; no new dependency; no motion/a11y surface added.
- The `instant-unrendered-segment` dev insight persists **until** Decision 2 is implemented
  (or muted per-page with `instant = false`); it is dev-only and never blocks the build.
- Decision 2, when taken, revises ADR 0023 §6 #3 and pairs with the pre-merge auth cleanup.

## Revisit triggers

- A genuine shared-element continuity case appears → build the reserved native
  `<ViewTransition>` crossfade (reduced-motion-gated, content-region only).
- We implement the pre-merge auth cleanup → land the DAL guard (Decision 2) and mark this ADR
  Accepted, superseding 0023 §6 #3.

## Sources

**Next 16.3 instant navigation**

- Instant Navigations (blog) — <https://nextjs.org/blog/next-16-3-instant-navigations>
- Ensuring instant navigations (guide) — <https://nextjs.org/docs/app/guides/instant-navigation>
- `instant` route-segment config (dev-only validation; build unaffected) —
  <https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant>
- Insight: `instant-unrendered-segment` — <https://nextjs.org/docs/messages/instant-unrendered-segment>
- View transitions (version-accurate: `import { ViewTransition } from 'react'`, no config in
  16.3) — the installed `next/dist/docs/01-app/02-guides/view-transitions.md`; React
  `<ViewTransition>` (canary/experimental) — <https://react.dev/reference/react/ViewTransition>
- `<Link>` `transitionTypes` (v16.2.0) — <https://nextjs.org/docs/app/api-reference/components/link>

**Auth-guard placement**

- Authentication guide (DAL; layouts-are-not-a-boundary; page-level guards) —
  <https://nextjs.org/docs/app/guides/authentication>
- Authentication with Cache Components — <https://nextjs.org/docs/app/guides/authentication-with-cache-components>
- Better Auth — Next.js integration (`getSessionCookie` optimistic-only) —
  <https://www.better-auth.com/docs/integrations/next>
- CVE-2025-29927 (middleware bypass — never the sole gate) —
  <https://snyk.io/blog/cve-2025-29927-authorization-bypass-in-next-js-middleware/>

**UX / accessibility / enterprise norms**

- View Transitions API + browser support — <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>,
  <https://caniuse.com/view-transitions>
- NN/g — Response-time limits; Animation duration —
  <https://www.nngroup.com/articles/response-times-3-important-limits/>,
  <https://www.nngroup.com/articles/animation-duration/>
- W3C — SC 2.3.3 Animation from Interactions —
  <https://w3c.github.io/wcag/understanding/animation-from-interactions>
- Emil Kowalski — You don't need animations — <https://emilkowal.ski/ui/you-dont-need-animations>
- Linear performance breakdown — <https://performance.dev/how-is-linear-so-fast-a-technical-breakdown>

See [0011](0011-authentication-strategy.md) (Better Auth), [0017](0017-backend-architecture-and-migration.md)
(framework-agnostic auth / backend split), [0019](0019-nextjs-rendering-and-performance.md)
(Cache Components / PPR), [0020](0020-ui-foundations-layout-responsiveness-accessibility.md)
(motion, reduced-motion), [0023](0023-app-shell-routing-and-boundaries.md) (app shell; §6 #3 the
guard placement this revises), [0025](0025-testing-strategy.md) (Playwright), and
[0031](0031-theme-switching-and-toggle-animation.md) (the sibling motion decision).
