# monorepo-starter-kit

> An enterprise-grade, **fullstack** monorepo foundation — Next.js 16, React 19, Tailwind CSS v4,
> shadcn/ui on Base UI, a self-hosted **Better Auth** backend (PostgreSQL + Drizzle +
> transactional email), wired together with Turborepo and pnpm — built to be reused as the
> starting point for the next serious application, not just this one.

[![CI](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/ci.yml)
[![CodeQL](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/codeql.yml/badge.svg)](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/codeql.yml)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2-0096FF?style=flat-square&logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)

## What you get

- **A working, wired auth product slice**: identifier-first sign-in / sign-up / forgot / reset,
  email verification, Google OAuth (opt-in), new-device emails — UI in `apps/web`, a
  framework-neutral Better Auth server in `packages/auth`, PostgreSQL + Drizzle in `packages/db`,
  React Email + an SMTP port in `packages/email`, a validated env contract in `packages/env`.
- **A design system** (`packages/ui`, shadcn/ui on Base UI) with a Storybook workspace whose
  story tests double as an accessibility gate.
- **A foundation that enforces its own rules**: single-version dependency catalog, source-only
  packages with `exports` boundaries + Turborepo Boundaries tags, type-aware ESLint 10, Prettier,
  Vitest 5 / Testcontainers / Playwright tiers, affected-only CI with blocking supply-chain gates,
  git hooks, and a package generator — every decision recorded as an ADR.

## Tech stack

| Tool                                 | Version                          | Notes                                                                      |
| ------------------------------------ | -------------------------------- | -------------------------------------------------------------------------- |
| Node.js                              | 24.21.0 (pinned)                 | `devEngines.runtime` — pnpm downloads and runs it; `.nvmrc` for editors/CI |
| pnpm                                 | 11 (pinned via `packageManager`) | self-managed; catalog + supply-chain settings in `pnpm-workspace.yaml`     |
| Turborepo                            | 2.11                             | task graph with transit nodes, Boundaries tags, affected CI                |
| TypeScript                           | 6                                | bridge to 7; `verbatimModuleSyntax`, `erasableSyntaxOnly`                  |
| Next.js                              | 16                               | App Router, Turbopack, Cache Components, React Compiler, typed routes      |
| React                                | 19                               |                                                                            |
| Tailwind CSS                         | 4                                | CSS-first config                                                           |
| shadcn/ui                            | 4 (CLI)                          | Base UI primitives — `@base-ui/react` (ADR 0021)                           |
| Better Auth                          | 1.7                              | self-hosted, framework-neutral (ADR 0011)                                  |
| PostgreSQL / Drizzle                 | 17 / 0.45                        | local via `docker compose` (ADR 0012)                                      |
| ESLint / Prettier                    | 10 / 3                           | flat config, type-aware; Prettier owns formatting                          |
| Vitest / Playwright / Testcontainers | 5 / 1.63 / 12                    | unit+component, e2e, real-Postgres integration (ADR 0025)                  |

## Repository structure

```text
.
├── apps/
│   ├── web/                 Next.js application — auth, dashboard
│   └── storybook/           Storybook for the design system (+ browser-mode story tests)
├── packages/                all @workspace/*, source-only
│   ├── ui/                  design system (shadcn/ui + Base UI)
│   ├── auth/ db/ email/ env/   Better Auth · Postgres + Drizzle · React Email · validated env
│   ├── utils/               pure, isomorphic helpers (the dependency-free leaf)
│   ├── e2e/                 Playwright end-to-end harness
│   └── eslint-config/ typescript-config/ vitest-config/   shared presets
├── turbo/generators/        `pnpm gen package` scaffold
└── docs/                    decisions/ (ADRs) · guides/ (how-to) · audits/ · future-improvements.md
```

Full map and placement rules: [docs/guides/repository-structure.md](docs/guides/repository-structure.md).

## Getting started

### Prerequisites

- **pnpm 11** — install once with the standalone script (`https://pnpm.io/installation`);
  from then on pnpm downloads the exact version this repo pins, and the exact Node.js runtime
  too (`devEngines.runtime`). No nvm/Corepack required. Inside the repo use `pnpm` and
  `pnpm dlx`, never `npm`/`npx`.
- **Docker** — only for the local PostgreSQL and the integration tests.

### Install, configure, run

```bash
pnpm install                               # also installs the git hooks
cp apps/web/.env.example apps/web/.env.local
# set BETTER_AUTH_SECRET:  openssl rand -base64 32
docker compose up -d                       # PostgreSQL 17 at localhost:5432
pnpm --filter @workspace/db db:migrate     # apply the schema
pnpm dev                                   # web at http://localhost:3000
```

## Commands

Run from the repo root (Turborepo, cached, affected-aware).

| Command                 | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| `pnpm dev`              | start all dev servers                            |
| `pnpm build`            | production build                                 |
| `pnpm lint`             | ESLint, every package, zero warnings allowed     |
| `pnpm typecheck`        | TypeScript, every package + root tooling         |
| `pnpm format`           | Prettier (writes) — the only formatter           |
| `pnpm test`             | unit + component tests                           |
| `pnpm test:integration` | real-Postgres integration tests (Docker)         |
| `pnpm test:e2e`         | Playwright journeys against the production build |
| `pnpm knip`             | unused files / exports / dependencies            |
| `pnpm gen package`      | scaffold a new workspace package                 |
| `pnpm deps:check`       | preview outdated dependencies (taze)             |

The full local gate: `pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm knip`.

```bash
pnpm exec turbo build --filter=web                       # one package
pnpm --filter storybook storybook                        # Storybook dev server
pnpm dlx shadcn@4.21.3 add button -c apps/web            # add a shadcn component into packages/ui
```

## Documentation

- **[Guides](docs/guides/)** — how to add a package or an app, manage dependencies, environment,
  testing, CI/CD, releases.
- **[Architecture decisions (ADRs)](docs/decisions/)** — the _why_ behind every convention.
- **[Audits](docs/audits/)** — periodic re-evaluations of the foundation against current
  official documentation.
- **[Future improvements](docs/future-improvements.md)** — deliberately deferred work, each item
  with a trigger.
- **[References](docs/references.md)** — sources used to build this repo.

## Make it yours

| What                 | Where                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Product name / brand | `packages/utils/src/product.ts` (name), `packages/ui/src/lib/brand.ts`, `packages/ui/src/components/brand/`                       |
| Repo name & badges   | root `package.json` `name`; this README; `.github/ISSUE_TEMPLATE/config.yml` links                                                |
| Code owners          | `.github/CODEOWNERS` (replace the placeholder with teams)                                                                         |
| Licence holder       | `LICENSE`, the [Licence](#licence) section                                                                                        |
| Email product copy   | `packages/email/src/components/email-layout.tsx`                                                                                  |
| Auth config          | `BETTER_AUTH_URL`, trusted origins, a real SMTP provider (ADR 0014), Google OAuth (opt-in)                                        |
| Legal pages          | `/terms` and `/privacy` links in `packages/ui/src/lib/brand.ts`                                                                   |
| GitHub settings      | import `.github/rulesets/main.json`; enable Dependabot alerts; squash-merge default — see the [CI/CD guide](docs/guides/ci-cd.md) |

## Contributing & security

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [SECURITY.md](SECURITY.md) for
reporting vulnerabilities (never in a public issue). Agents read [AGENTS.md](AGENTS.md).

## Licence

**Proprietary — © 2026 Aswini. All rights reserved.** Source-available for reference only; see
[LICENSE](LICENSE). Not licensed for reuse, redistribution, or commercial use without prior
written permission.

## Acknowledgments

Built on the excellent work of [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com),
[Turborepo](https://turborepo.dev), [pnpm](https://pnpm.io), [Next.js](https://nextjs.org),
[Tailwind CSS](https://tailwindcss.com), and [Better Auth](https://better-auth.com).
