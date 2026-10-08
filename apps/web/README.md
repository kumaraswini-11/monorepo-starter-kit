# web

The **Next.js 16** application (App Router, React 19, Cache Components/PPR). The only
Next-specific layer — auth, data, and email live in `@workspace/*` packages, consumed here.

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `test`

The auth transport is isolated behind `features/auth/actions.ts` (the seam, ADR 0017/0028); component tests are co-located,
end-to-end tests live in `packages/e2e`. See ADRs
[0019](../../docs/decisions/0019-nextjs-rendering-and-performance.md) (rendering/perf),
[0022](../../docs/decisions/0022-forms-rhf-submission-and-pending.md) (forms),
[0023](../../docs/decisions/0023-app-shell-routing-and-boundaries.md) (app shell, routing & state),
[0017](../../docs/decisions/0017-backend-architecture-and-migration.md) (fullstack + split).
