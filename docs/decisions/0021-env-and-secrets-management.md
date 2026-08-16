# 0021. Environment variables & secrets management

- **Status:** Accepted
- **Date:** 2026-08-04 · **Updated:** 2026-08-15 (§5 env validation implemented)

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

### 5. Shared, typed, validated env: `@workspace/env` (implemented 2026-08-15)

Env is validated **once** in a shared package so the schema isn't duplicated and a
missing/invalid `DATABASE_URL` / `BETTER_AUTH_SECRET` **fails fast at startup** — this
replaces the `process.env.X ?? "localhost…"` fallbacks that silently masked bad config.

**Library — `@t3-oss/env-core` (framework-agnostic), _not_ `@t3-oss/env-nextjs`.**
R&D (sources below) confirmed **t3-env** is the 2026 standard for typed env in TS — the
`create-t3-app` default (very high real-world usage), **Standard-Schema** based so it
uses our existing **zod**, small/focused/maintained. Critically we use the **`env-core`**
variant: it takes `runtimeEnv: process.env` and imports nothing framework-specific —
unlike `env-nextjs`, which hard-codes Next's `NEXT_PUBLIC_` + build integration. This
keeps `@workspace/env` **portable**: it runs unchanged in Next (fullstack) _or_ a
standalone Node / Express / NestJS backend — no lock-in, satisfying the
"fullstack-vs-separate-backend is undecided, so don't lock in" constraint. (Plain zod
was the lighter alternative — no new dep — but env-core won for the server/client guard
and build-skip ergonomics at a tiny agnostic cost.)

**Not over-engineering:** for a monorepo with ≥3 consumers (`db`/`auth`/`web`), one
shared schema beats duplicated reads; fail-fast typed env is a 12-Factor best practice.

**Guarded against bypass:** an ESLint rule (`no-restricted-syntax`) bans `process.env`
outside `@workspace/env` + config/tooling files, so a new contributor can't accidentally
read raw env — the error points them to the validated contract.

**Build-time safety (the [0019] "build needs no DB/secret" rule):** validation runs at
import, which happens during `next build`. `skipValidation` (gated on
`SKIP_ENV_VALIDATION`, which our CI sets) keeps a secret-free build green; real runtimes
— and local `.env.local` — still validate. `emptyStringAsUndefined` treats blanks as
missing.

**Deployment portability:** Vercel / Railway / AWS / Azure all inject vars into
`process.env`; env-core reads `process.env` and validates at startup, so the code is
identical everywhere — the only per-platform difference is _where you set the vars_, not
how they're read.

**Client env:** none today (all four vars are server-side), so the package is
`server-only`. If a browser var appears, add a `client` block with `clientPrefix`
(env-core handles it generically) — the shared package stays neutral. `apps/web`
metadata/robots/sitemap read a build-safe `appUrl` export instead of `process.env`.

**Status: implemented** — `@workspace/env`; `db`/`auth` read `env.*`.

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
- `@workspace/env` gives a single validated env contract (`@t3-oss/env-core`,
  framework-agnostic), fails fast on missing/invalid vars, and a lint guard blocks raw
  `process.env`. **Implemented.**

## Revisit triggers

- **Second app or first real secrets** → provision the secrets manager (confirm
  Infisical vs Doppler/Vault with a focused comparison then).
- **A build-affecting client var** (`NEXT_PUBLIC_*` inlined at build) → declare it in
  the task's hashed `env`, not passthrough.
- **A shared dev value genuinely needed by many apps before the manager lands** →
  interim, load it via each app's `@next/env` / `dotenv` from one documented source.
- **A browser (`NEXT_PUBLIC_*`) env var** → add a `client` block + `clientPrefix` to
  `@workspace/env` (env-core supports it); keep the package framework-neutral.

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
- T3 Env — framework-agnostic core + Next variant (Standard Schema, zod):
  <https://env.t3.gg/docs/core>, <https://env.t3.gg/docs/nextjs>
- Env-validation comparison (dotenv vs t3-env vs envalid, 2026):
  <https://www.pkgpulse.com/guides/dotenv-vs-t3-env-vs-envalid-env-validation-nodejs-2026>
- Prisma — Turborepo guide (contrasting `globalEnv` + package `.env`):
  <https://www.prisma.io/docs/guides/deployment/turborepo>
- Infisical (open-source, self-hostable secrets manager): <https://infisical.com>

See [0016](0016-authentication-strategy.md) (auth — first env consumer),
[0019](0019-data-layer-postgres-drizzle.md) (data layer / DB hosting),
[../references.md](../references.md), and [../future-improvements.md](../future-improvements.md).
