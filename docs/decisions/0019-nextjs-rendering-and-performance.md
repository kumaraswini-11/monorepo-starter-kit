# 0019. Next.js rendering & performance model — Cache Components (PPR)

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Before building more UI, we audited the app against the **Next.js 16.3** and
**React 19** best practices and the Next team's "much faster / less latency" claims:
which wins are automatic, and which we must opt into. This ADR records the rendering
& performance model so future pages are built the right way from the start.

### How we decided

Read the **version-matched bundled docs** (`node_modules/next/dist/docs/`, pinned to
our installed 16.3.0 — not the 16.2 copy also in the store) — the production
checklist, `cacheComponents`, `use cache`, rendering philosophy, `reactCompiler`,
`optimizePackageImports` — plus the React 19 reference (Actions / `useActionState`).
Sources at the end.

## Already automatic — no configuration (verified)

These are the bulk of the "faster" story and we already get them:

- **Turbopack** — the default bundler for **`dev` and `build`** in Next 16.
- **Disk caching** (default in 16.3) + `dev`/`build` no longer conflict (`.next/dev`).
- **Instant Navigations / layout deduplication** (16.3) — shared route-group layouts
  download once; this rewards our `(auth)` / `(app)` layouts.
- **RSC by default + code-splitting + prefetching**; client islands only for forms.
- **`optimizePackageImports`** already covers `lucide-react`, `date-fns`, `recharts`
  **by default** — our icon/date/chart imports are tree-shaken with no config.
- **`next/font`** (no CLS), security headers ([0015]), error/404 + metadata/robots/
  manifest ([app foundation]).

## Decision

1. **Adopt Cache Components (`cacheComponents: true`).** This is the stable (Next
   16.0) unification of **PPR + `use cache` + dynamicIO**: a prerendered **static
   shell** is served instantly while **dynamic content streams** in under Suspense,
   `use cache` (+ `cacheLife`/`cacheTag`) opts data into caching, and React
   `<Activity>` preserves UI state across client navigation.
   - **Dynamic access** (`cookies`/`headers`/`fetch`/`params`/`searchParams`) must sit
     under a **`<Suspense>`** boundary (a segment `loading.tsx`) **or** the route must
     declare **`export const instant = false`** (request-blocking).
   - The **authed `(app)` area is per-user** (reads the session cookie every request),
     so it has no useful static shell → we set **`instant = false`** on its layout.
     Public/mostly-static pages (sign-in) prerender normally.
2. **React 19 form idiom (rendering-relevant note only).** Forms are the app's client
   islands (RSC-by-default everywhere else). The React 19 fullstack idiom is
   **`<form action>` + `useActionState`** — a built-in pending flag plus returned error
   state from the hook (no manual `useState`/`onSubmit`), with full Server Actions
   remaining an option for progressive enhancement once we wire server-side cookie
   setting. **The full forms story — the backend-agnostic React-Hook-Form default that
   is our current form baseline vs. the `useActionState`/Server-Actions fullstack option
   — is decided in [0022](0022-forms-rhf-submission-and-pending.md); this ADR keeps only
   the rendering note that forms are the sole client islands.**
3. **React Compiler — enabled** (`reactCompiler: true` + `babel-plugin-react-compiler`).
   Auto-memoizes components (fewer runtime re-renders; drops manual `useMemo`/
   `useCallback`) at the cost of a **slightly slower Babel compile step** — Next limits
   it to JSX/hook files, so the hit is small and localized. Verified compatible with
   our Turbopack build. Trade-off accepted: faster app for users > small dev-build cost.
4. **`typedRoutes` — commented, pending routes.** Type-safe `<Link>` hrefs, but it
   errors on links to routes that don't exist yet (`/sign-up`, `/forgot-password`).
   Enable once all auth routes exist.

## Consequences

- **Data is dynamic-by-default; you opt _into_ caching** with `use cache`. Every new
  route that reads request data needs a Suspense/`loading.tsx` boundary or
  `instant = false` — a small, explicit discipline the build enforces.
- The authed area is fully dynamic (correct for per-user pages). **PPR's benefit
  accrues to future _mixed_ pages** (static shell + dynamic islands), where we'll use
  Suspense + `use cache` rather than `instant = false`.
- **Interacts with the deferred strict CSP ([0015]):** a nonce-based CSP forces
  dynamic rendering; Cache Components' streaming model is compatible, but revisit the
  two together when the CSP lands.
- Net for the current auth-only app: behaviour is unchanged (auth pages were already
  static, the dashboard already dynamic) — we've **adopted the model now** so richer
  pages don't require a later migration.

## Independent of how Next.js is used (fullstack vs frontend-only)

This whole model is **Next.js _frontend / rendering_ behavior** — it applies
identically whether the backend runs **inside** Next (fullstack) or is a **separate**
service (Next as pure frontend). Cache Components, the React Compiler, `typedRoutes`,
and the error/loading/metadata conventions don't depend on that choice.

- **`use cache` works against any async data source** — in fullstack it caches direct
  DB/service reads; in frontend-only it caches responses from the external API. Same
  feature, different source.
- Our repo currently runs **fullstack** (Better Auth in the `/api/auth` route handler
  and server-side `getSession`), but `packages/auth` / `db` / `email` are
  framework-agnostic ([0011](0011-authentication-strategy.md)), so extracting a
  standalone backend later changes the auth **wiring**, **not** this rendering model.

## Revisit triggers

- **First page with a static shell + dynamic islands** → realize PPR: Suspense +
  `use cache`, not `instant = false`.
- **All auth routes exist** → uncomment `typedRoutes: true`.
- **Analytics lands** → add `useReportWebVitals` (Core Web Vitals) and
  `@next/bundle-analyzer` to the perf workflow.

## Sources

- Next.js bundled docs (16.3, `node_modules/next/dist/docs/`): `cacheComponents`,
  `use cache` directive, rendering philosophy, production checklist, `reactCompiler`,
  `optimizePackageImports`, error-handling, file conventions (`loading`, `error`).
- Next.js 16.3 release notes — <https://nextjs.org/blog/next-16-3>
- Partial Prerendering / Cache Components — <https://nextjs.org/docs/app/getting-started/caching>, <https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents>
- React Compiler — <https://react.dev/learn/react-compiler>
- React 19 (Actions, `useActionState`, `useOptimistic`) — <https://react.dev/blog/2024/12/05/react-19>, <https://react.dev/reference/react/useActionState>

See [0015](0015-web-security-headers.md) (CSP interaction), [0012](0012-data-layer-postgres-drizzle.md), and [../future-improvements.md](../future-improvements.md).
