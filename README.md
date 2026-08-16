# monorepo-starter-kit

> An enterprise-grade, **fullstack** monorepo starter — Next.js 16, React 19,
> Tailwind CSS v4, and shadcn/ui (Base UI), with a self-hosted **Better Auth**
> foundation (PostgreSQL + Drizzle + transactional email), wired together with
> Turborepo and pnpm.

[![CI](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/ci.yml)
[![CodeQL](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/codeql.yml/badge.svg)](https://github.com/kumaraswini-11/monorepo-starter-kit/actions/workflows/codeql.yml)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2-0096FF?style=flat-square&logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)

## About

**monorepo-starter-kit** is a batteries-included, **auth-ready** foundation for
building scalable products. It ships:

- a shared, themeable **UI library** (shadcn/ui on Base UI) with a **Storybook**
  workspace;
- a complete, **presentational auth flow** — sign-in / sign-up / forgot / reset,
  identifier-first, accessible (WCAG-minded), and responsive (mobile → TV);
- a framework-neutral **Better Auth** backend (self-hosted, own-DB) with
  **PostgreSQL + Drizzle** and a **transactional email** port;
- centralized ESLint & TypeScript configs and a cached Turborepo task pipeline —
  so every app starts consistent and stays maintainable as the codebase grows.

> **The auth UI is built; the backend is set up but intentionally _not yet wired_
> to the UI.** The seam is explicit (each form takes an injected `onSubmit`), so
> you clone this and wire auth per project. See
> **[ADR 0027](docs/decisions/0027-backend-architecture-fullstack-and-migration.md)**
> for the fullstack decision, the step-by-step wiring plan, and a separate-backend
> migration playbook.

## Tech Stack

| Tool         | Version | Notes                                                |
| ------------ | ------- | ---------------------------------------------------- |
| Next.js      | 16      | App Router, Turbopack                                |
| React        | 19      |                                                      |
| TypeScript   | 5       | Strict, `noUncheckedIndexedAccess`                   |
| Tailwind CSS | 4       | CSS-first config, `tw-animate-css`                   |
| shadcn/ui    | latest  | Base UI primitives — default `@base-ui/react`        |
| Better Auth  | latest  | Self-hosted, framework-neutral auth (ADR 0016)       |
| PostgreSQL   | 17      | Local via `docker-compose` (ADR 0019)                |
| Drizzle ORM  | latest  | TS-first schema + migrations (ADR 0019)              |
| React Email  | latest  | Templated email behind a `sendEmail` port (ADR 0020) |
| Turborepo    | 2       | Task orchestration & caching                         |
| pnpm         | 10      | Workspaces, pinned via `packageManager`              |
| ESLint       | 9       | Flat config                                          |
| Prettier     | 3       | With Tailwind class sorting                          |

## Repository Structure

```text
.
├── apps/
│   ├── web/         # Next.js 16 application — auth UI, dashboard
│   └── storybook/   # Storybook for the shared UI library
├── packages/
│   ├── ui/                  # Shared components (shadcn/ui + Base UI) — source-only
│   ├── auth/                # Better Auth server + client (framework-neutral)  — ADR 0016
│   ├── db/                  # PostgreSQL + Drizzle schema & client              — ADR 0019
│   ├── email/               # React Email templates + `sendEmail` port          — ADR 0020
│   ├── env/                 # Validated environment contract (fail-fast)        — ADR 0021
│   ├── eslint-config/       # Shared ESLint flat configs
│   └── typescript-config/   # Shared tsconfig presets
└── docs/                    # Architecture decisions (ADRs), references, future work
```

## Getting Started

### Prerequisites

- **Node.js** 24+ (LTS) — matches `.nvmrc` (`pnpm install` is `engine-strict`)
- **pnpm** via [Corepack](https://nodejs.org/api/corepack.html) — run
  `corepack enable`
- **Docker** — only needed to run PostgreSQL locally when you wire/run auth

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
# then set BETTER_AUTH_SECRET — generate one with:  openssl rand -base64 32
```

### 3. Database (only needed for auth)

```bash
docker compose up -d            # PostgreSQL 17 at localhost:5432 (matches .env.example)
# apply the schema with drizzle-kit (see packages/db for the exact script)
```

### 4. Develop

```bash
pnpm dev                        # web at http://localhost:3000
```

> The auth **UI runs without a database** — it's presentational. The database and
> secret are only required once you **wire** the auth calls (see below).

## Backend / Auth

The auth screens are complete and **presentational** (ADR 0025): each form takes an
injected `onSubmit`, decoupling the UI from any backend. The Better Auth server
(`packages/auth`) is configured and **framework-neutral** (it mounts under Next.js
today via a ~3-line route handler, or under a standalone Node service unchanged).

To make auth **functional**, wire the UI to it. The recommended seam, the
step-by-step wiring, the identifier-first existence-check nuance, and — if you later
outgrow fullstack — the separate-backend migration are all documented in
**[ADR 0027](docs/decisions/0027-backend-architecture-fullstack-and-migration.md)**.
Wiring points are marked in code with `// Wiring:` comments in
`apps/web/components/auth/*-step.tsx`.

## Commands

Run from the repo root.

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `pnpm dev`        | Start all dev servers (web → <http://localhost:3000>) |
| `pnpm build`      | Build everything                                      |
| `pnpm lint`       | Lint the workspace (fails on any warning)             |
| `pnpm typecheck`  | Type-check the workspace                              |
| `pnpm format`     | Format the whole repo                                 |
| `pnpm deps:check` | Check for dependency updates (`taze`)                 |

```bash
# A single package (via Turbo, cached):
pnpm exec turbo build --filter=web
pnpm --filter web dev
pnpm --filter storybook build:storybook

# Format only part of the tree (Prettier is path-based, not per-package):
pnpm exec prettier --write apps/web
```

Filterable names: `web`, `storybook`, `@workspace/ui`, `@workspace/auth`,
`@workspace/db`, `@workspace/email`, `@workspace/env`,
`@workspace/eslint-config`, `@workspace/typescript-config`.

## Usage

Add shadcn/ui components into the shared `ui` package, targeting the web app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Then import them anywhere:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Make it yours

This starter ships with the author's defaults. When you clone it for a **new
project**, update these spots:

| What           | Where                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| App / brand    | `packages/ui/src/lib/brand.ts` (name + logo); page `metadata` in `apps/web/app`                              |
| Package name   | root `package.json` `name`; this README's title + badges                                                     |
| Repo URLs      | CI / CodeQL badge URLs above → your GitHub org/repo                                                          |
| License holder | `LICENSE` and the [License](#license) section (© your org)                                                   |
| Email product  | `packages/email/src/components/email-layout.tsx` (product-name TODO)                                         |
| Auth config    | `BETTER_AUTH_URL` + trusted origins for your domain; a real email provider (dev is a console stub, ADR 0020) |
| Legal pages    | `/terms` and `/privacy` are linked from the auth entry — add real pages before launch                        |

## Documentation

- **[Architecture Decisions (ADRs)](docs/decisions/)** — the _why_ behind key
  technical and process choices.
- **[References](docs/references.md)** — curated tools, templates, and docs used
  to build this repo.
- **[Future improvements](docs/future-improvements.md)** — consciously deferred
  items to revisit as the project grows.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and the pull
request process. Please also review our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Please follow the process in [SECURITY.md](SECURITY.md) —
**do not** open a public issue.

## License

**Proprietary — © 2026 Aswini. All rights reserved.** This source is available
for reference only; see [LICENSE](LICENSE). It is not licensed for reuse,
redistribution, or commercial use without prior written permission.

## Acknowledgments

Built on the excellent work of [shadcn/ui](https://ui.shadcn.com),
[Turborepo](https://turborepo.dev), [Next.js](https://nextjs.org),
[Base UI](https://base-ui.com), [Tailwind CSS](https://tailwindcss.com), and
[Better Auth](https://better-auth.com).
