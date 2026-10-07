# Testing

Governing decision: [0025](../decisions/0025-testing-strategy.md) (strategy, tools, maturity
path); [0024](../decisions/0024-storybook-and-component-testing.md) (stories as tests);
[0035](../decisions/0035-task-graph-correctness-and-affected-ci.md) (what is cached).

## The tiers

| Tier                 | What it proves                                             | Owner / location                                         | Runner                                                    | Cached             | Runs on                               |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- | ------------------ | ------------------------------------- |
| **Unit / component** | a function or component in isolation                       | the owning package, co-located `*.test.ts(x)`            | Vitest 5 (`base` = Node, `dom` = jsdom + Testing Library) | yes (`topo`-aware) | every PR (affected)                   |
| **Story tests**      | every story renders, interactions pass, no a11y violations | `packages/ui/**/*.stories.tsx`, run by `apps/storybook`  | Vitest browser mode (chromium)                            | yes                | every PR (affected)                   |
| **Integration**      | real SQL, real Better Auth flows                           | `packages/db`, `packages/auth` — `*.integration.test.ts` | Vitest + Testcontainers (ephemeral `postgres:17`)         | no                 | every PR (affected)                   |
| **E2E**              | user journeys against the production build                 | `packages/e2e`                                           | Playwright (chromium)                                     | no                 | every PR (affected); always on `main` |

Coverage is collected (`--coverage`) and **report-only** until a baseline exists (ADR 0025).

## Commands

```bash
pnpm test                       # unit + component, every package (turbo, cached)
pnpm test:integration           # needs Docker (Testcontainers)
pnpm test:e2e                   # needs the docker-compose Postgres; builds web first
pnpm --filter storybook test    # story tests (needs a Playwright chromium)
pnpm --filter @workspace/ui test -- --watch   # one package, watch mode
```

## Writing tests

- **Unit/component**: `export { base as default }` or `dom` from `@workspace/vitest-config` in
  the package's `vitest.config.ts`; `server-only` is aliased to a no-op under test. jsdom
  packages add a one-line `vitest.d.ts` for the jest-dom matcher types.
- **Integration**: `vitest.integration.config.ts` merges the shared `integration` preset with
  the `@workspace/db/testing` harness (`global-setup` starts one container per run and applies
  the real migrations; `setup-env` points the client at it; `reset` wipes between tests).
- **E2E**: setup work is a Playwright _project with dependencies_ (`db` resets + migrates,
  `setup` authenticates once and saves `storageState`), never `globalSetup`. The database is
  disposable: `resetSchema` refuses a non-loopback host unless `ALLOW_DESTRUCTIVE_DB=1`.
- **Stories**: co-located with the component; `addon-a11y` runs in `error` mode, so an
  accessibility violation fails the story test.

## What runs where

`turbo test` depends on the `topo` transit node, so a cached test result is invalidated when a
_dependency package's_ source changes. Integration and e2e are uncached by design. In CI, pull
requests run only affected packages; `main` runs everything.
