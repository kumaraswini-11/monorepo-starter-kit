# @workspace/db

The **data layer** — Drizzle schema, repository functions, and the Postgres client. The single,
one-way data-access boundary: the only package that touches `drizzle-orm` / `pg` (ADR 0019).

## Entry points

| Import                    | What                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `@workspace/db`           | repositories (`getUserById`, `isNewDeviceSignIn`) + domain types                   |
| `@workspace/db/schema`    | Drizzle table definitions                                                          |
| `@workspace/db/client`    | raw Drizzle handle + `pool` (adapter surface — consumed only by `@workspace/auth`) |
| `@workspace/db/queries/*` | per-aggregate repositories                                                         |
| `@workspace/db/testing/*` | integration-test harness (Testcontainers `global-setup`, `setup-env`, `resetDb`)   |

Server-only; migrations live in `migrations/` (drizzle-kit — `pnpm --filter @workspace/db db:generate`).
See ADRs [0019](../../docs/decisions/0019-data-layer-postgres-drizzle.md),
[0029](../../docs/decisions/0029-testing-strategy.md) (test harness).
