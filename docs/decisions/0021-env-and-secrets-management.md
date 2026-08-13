# 0021. Environment variables & secrets management

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Wiring the auth foundation ([0016](0016-authentication-strategy.md)) and data layer
([0019](0019-data-layer-postgres-drizzle.md)) introduced the first real environment
variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`). ADR 0019
explicitly deferred **environment-variable management** to a later ADR — this is it.

Guiding rule for this ADR: **decide at scale** — assume the repo will hold **multiple
apps**, and prefer approaches that don't break (or force duplication) when the second
app arrives. Decisions that are cheap now and expensive to retrofit are made now; the
code is kept **ready** for the operational pieces so adoption is friction-free.

### How we decided

A focused, internet-wide research pass against **official docs** — Turborepo (env
handling + `turbo.json` reference + strict/loose modes), Next.js (env loading),
Drizzle (config), and **The Twelve-Factor App** — plus the data-layer research behind
[0019](0019-data-layer-postgres-drizzle.md) for the hosting question. Sources listed
at the end.

## Questions & critiques interrogated

Each of these was raised as a genuine doubt and pressure-tested (not assumed):

- **"Why a root `.env`? Shouldn't env files be per-project?"** — my initial
  root-level `.env.example` was challenged, and rightly.
- **"Why declare env in `turbo.json` (`globalPassThroughEnv`)? Is that the right,
  official approach — and won't that list get huge as env grows?"**
- **"You said Neon but created a docker file — do we need Neon or not?"**
- **"At scale with multiple apps, per-app `.env` means we duplicate shared secrets
  across every app — isn't that wrong?"**

## Decisions

### 1. `.env` files live **per-app**, never at the repo root

Turborepo's official guidance is explicit: _"Using a `.env` file at the root of the
repository is not recommended,"_ because it models runtime poorly and leaks vars
across apps. Next.js only auto-loads `.env*` from the **app directory** (the folder
with `next.config.ts`), never the monorepo root. So:

- Real values → `apps/<app>/.env.local` (**git-ignored**).
- Template/contract → `apps/<app>/.env.example` (**tracked**, via the `!.env.example`
  negation in `.gitignore`).
- Shared **server** packages (`db` / `auth` / `email`) run _inside_ the app's process,
  so they read `process.env` from it — no separate runtime file.
- **drizzle-kit** runs as a _separate_ process, so `drizzle.config.ts` loads the app's
  env file explicitly (wired at the migration step; keeps one source of truth).

_(My earlier root `.env.example` was corrected to `apps/web/.env.example` in commit
`0017fc7`.)_

### 2. `turbo.json` env declaration — passthrough + wildcards

Declaring env vars in `turbo.json` **is the official Turborepo mechanism** — it's about
**cache correctness** (Turbo must know which vars affect a task's output) and it also
satisfies the repo's `turbo/no-undeclared-env-vars` lint rule (ADR 0003). The knobs:

- `globalEnv` — hashes **every** task → a change busts all caches. **Avoid** for
  volatile runtime vars.
- `env` (per-task) — hashed for that task. Use **only** for vars that affect that
  task's **output** (e.g. `NEXT_PUBLIC_*` inlined into a build).
- `passThroughEnv` / `globalPassThroughEnv` — made available to tasks but **not**
  part of the cache key.

Our runtime vars (`DATABASE_URL`, `BETTER_AUTH_*`) do **not** affect build output (the
build is designed to run with no DB — see [0019](0019-data-layer-postgres-drizzle.md)),
so they belong in **`globalPassThroughEnv`** (not hashed → no cache cost) and we use a
**wildcard** to keep the list short forever:

```jsonc
"globalPassThroughEnv": ["DATABASE_URL", "BETTER_AUTH_*"]
```

Strict mode (Turbo's default) is kept; `NEXT_PUBLIC_*` is auto-inferred per-package;
migration tasks are `cache: false`. This answers the "won't it get long?" concern —
wildcards + passthrough scale cleanly.

### 3. Database hosting is a `DATABASE_URL` change, not code (Neon is optional)

There is **no contradiction** between "docker" and "Neon" — it's all standard Postgres
(cross-ref [0019](0019-data-layer-postgres-drizzle.md)):

- **docker-compose Postgres** = the local-dev default (zero cloud signup).
- **Self-hosted Postgres** = production system-of-record (compliance / own-the-data).
- **Neon** = an _optional, reversible_ managed option for dev/preview.

All three differ only by the `DATABASE_URL` string — no code change. **Neon is not
required**; docker is the default.

### 4. Secrets at scale = a **secrets manager**, and the code is already ready

The multi-app critique is correct: **per-app `.env` files duplicate** shared secrets,
and a **root file leaks** them across apps — so neither scales. The only approach that
satisfies **dedupe + no-leak + nothing-committed** is a **secrets manager**.

Crucially, **our code is already manager-ready**: everything reads `process.env`, which
is the universal seam. A manager just injects it — dev (`infisical run -- pnpm dev`) and
prod (platform injection). So **no code changes** are needed to scale; adoption is
purely provisioning the service.

- **Recommended tool: [Infisical](https://infisical.com)** — open-source and
  **self-hostable**, which fits our self-host / own-the-data / no-vendor-lock-in stance
  (unlike SaaS-only Doppler). Alternatives: **Doppler** (great DX, SaaS), **HashiCorp
  Vault** (heavy, enterprise). _Tool choice to be confirmed with a focused comparison
  at adoption time._
- **Adoption trigger:** the second app (or the first real, non-placeholder secrets).
  Provisioning the instance is infra we stand up then; the decision + seam are locked
  now, so it is **not** left vague.

### 5. Shared, typed env **contract**: `packages/env`

To avoid duplicating the env _schema_ across apps and to fail-fast on a missing/invalid
`BETTER_AUTH_SECRET` / `DATABASE_URL`, env is validated once in a shared, framework-
agnostic **`packages/env`** (zod-based), imported by every app and by
`packages/auth` / `packages/db`. One definition of the contract; type-safe; validated
at startup. **Status: to implement** (decided here; slots into the Phase 0 build).

### 6. Twelve-Factor baseline

Config comes from **the environment**, strictly separated from code — _"the codebase
could be made open source at any moment without compromising credentials."_ `.env` is a
dev convenience only, always git-ignored; production injects real values via the
platform's secret store. No named per-environment files committed.

## Consequences

- Env files are per-app; `.env.example` is the tracked contract, `.env.local` the
  git-ignored real file. Adding an app = add its `.env.example`, not another copy of
  shared secrets.
- `turbo.json` stays short and cache-correct via passthrough + wildcards.
- Hosting (docker / self-host / Neon) is a config change, never a code change.
- We are secrets-manager-ready today (the `process.env` seam) with **zero** code debt;
  standing up Infisical is a provisioning step at the multi-app trigger.
- `packages/env` gives a single, validated env contract across apps (pending build).

## Revisit triggers

- **Second app or first real secrets** → provision the secrets manager (confirm
  Infisical vs Doppler/Vault with a focused comparison then).
- **A build-affecting client var** (`NEXT_PUBLIC_*` inlined at build) → declare it in
  the task's hashed `env`, not passthrough.
- **A shared dev value genuinely needed by many apps before the manager lands** →
  interim, load it via each app's `@next/env` / `dotenv` from one documented source.

## Sources

- Turborepo — Using environment variables:
  <https://turborepo.dev/repo/docs/crafting-your-repository/using-environment-variables>
- Turborepo — `turbo.json` reference (`env` / `globalEnv` / `passThroughEnv` /
  `globalPassThroughEnv`, wildcards): <https://turborepo.dev/repo/docs/reference/configuration>
- Turborepo — System environment variables (strict / loose modes):
  <https://turborepo.dev/repo/docs/reference/system-environment-variables>
- Next.js — Environment Variables (load order, app-dir, `@next/env` for ORM configs,
  `NEXT_PUBLIC_`): <https://nextjs.org/docs/pages/guides/environment-variables>
- Drizzle — config file (`dbCredentials`, no auto-`.env`):
  <https://orm.drizzle.team/docs/drizzle-config-file>
- The Twelve-Factor App — Config: <https://12factor.net/config>
- Prisma — Turborepo guide (contrasting `globalEnv` + package `.env`):
  <https://www.prisma.io/docs/guides/deployment/turborepo>
- Infisical (open-source, self-hostable secrets manager): <https://infisical.com>

See [0016](0016-authentication-strategy.md) (auth — first env consumer),
[0019](0019-data-layer-postgres-drizzle.md) (data layer / DB hosting),
[../references.md](../references.md), and [../future-improvements.md](../future-improvements.md).
