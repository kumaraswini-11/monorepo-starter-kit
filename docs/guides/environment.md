# Environment & configuration

Governing decisions: [0013](../decisions/0013-env-and-secrets-management.md) (per-app env files,
validated contract, secrets), [0035](../decisions/0035-task-graph-correctness-and-affected-ci.md)
(build-time vs runtime vars in the task graph).

## Where values live

| Context              | Source                                | Notes                                                                                                    |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Local dev            | `apps/<app>/.env.local` (git-ignored) | copy from `apps/<app>/.env.example`; never at the repo root                                              |
| Tests                | set by the harness                    | integration: `@workspace/db/testing` injects the container URL; e2e: `packages/e2e/playwright.config.ts` |
| CI                   | none                                  | `SKIP_ENV_VALIDATION=1`; real runtimes still fail fast at startup                                        |
| Staging / production | the platform's secret store           | injected into `process.env`; never a file                                                                |

## Reading a value

Only `@workspace/env` reads `process.env` (an ESLint rule enforces it). Add the variable to
its zod schema, then `import { env } from "@workspace/env"`. A missing or malformed required
variable throws at startup, not somewhere in a request. Client-visible variables would need a
`clientPrefix` block (none exist today).

Dev-time tools that run outside the app (drizzle-kit, Playwright config) read `process.env`
directly and are exempt via file patterns in the ESLint configs.

## Declaring a value to Turborepo

- Runtime-only (secrets, URLs read at request time) → `globalPassThroughEnv` in `turbo.json`:
  available to tasks, **not** part of the cache hash.
- Changes build output (anything prerendered — e.g. `BETTER_AUTH_URL` feeds `metadataBase`) →
  the task's `env`: part of the hash. `turbo/no-undeclared-env-vars` fails lint if a variable is
  read but declared nowhere.
- `NEXT_PUBLIC_*` is hashed automatically (framework inference).

## Adding a second app

Keep `@workspace/env` as the shared contract and compose app-specific presets with t3-env
`extends` (the documented monorepo pattern) rather than a second env package.
