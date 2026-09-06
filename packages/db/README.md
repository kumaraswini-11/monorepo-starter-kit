# @workspace/db

The **data layer** — Drizzle schema, repository functions, and the Postgres client. The single,
one-way data-access boundary: the only package that touches `drizzle-orm` / `pg` (ADR 0012).

## Entry points

| Import                    | What                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `@workspace/db`           | repositories (`getUserById`, `isNewDeviceSignIn`) + domain types                   |
| `@workspace/db/schema`    | Drizzle table definitions                                                          |
| `@workspace/db/client`    | raw Drizzle handle + `pool` (adapter surface — consumed only by `@workspace/auth`) |
| `@workspace/db/queries/*` | per-aggregate repositories                                                         |
| `@workspace/db/testing/*` | integration-test harness (Testcontainers `global-setup`, `setup-env`, `resetDb`)   |

Server-only; migrations live in `migrations/` (drizzle-kit — `pnpm --filter @workspace/db db:generate`).
See ADRs [0012](../../docs/decisions/0012-data-layer-postgres-drizzle.md),
[0025](../../docs/decisions/0025-testing-strategy.md) (test harness).
