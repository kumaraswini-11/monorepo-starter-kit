# web

The **Next.js 16** application (App Router, React 19, Cache Components/PPR). The only
Next-specific layer — auth, data, and email live in `@workspace/*` packages, consumed here.

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `test`

The auth transport is isolated behind `lib/auth/` (the seam); component tests are co-located,
end-to-end tests live in `apps/e2e`. See ADRs
[0023](../../docs/decisions/0023-nextjs-rendering-and-performance-model.md) (rendering/perf),
[0025](../../docs/decisions/0025-frontend-architecture-forms-data-state-routing.md) (frontend arch),
[0027](../../docs/decisions/0027-backend-architecture-fullstack-and-migration.md) (fullstack + split).
