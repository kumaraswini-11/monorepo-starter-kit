# monorepo-starter-kit

> An enterprise-grade, production-ready frontend monorepo starter — Next.js 16,
> React 19, Tailwind CSS v4, and shadcn/ui, wired together with Turborepo and
> pnpm.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2-0096FF?style=flat-square&logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)

## About

**monorepo-starter-kit** is a batteries-included foundation for building
scalable frontend applications. It ships a shared, themeable UI library
(shadcn/ui on Base UI), centralized ESLint and TypeScript configs, and a cached
Turborepo task pipeline — so every app starts consistent and stays maintainable
as the codebase grows.

## Tech Stack

| Tool         | Version | Notes                                         |
| ------------ | ------- | --------------------------------------------- |
| Next.js      | 16      | App Router, Turbopack                         |
| React        | 19      |                                               |
| TypeScript   | 5       | Strict, `noUncheckedIndexedAccess`            |
| Tailwind CSS | 4       | CSS-first config, `tw-animate-css`            |
| shadcn/ui    | latest  | Base UI primitives — default `@base-ui/react` |
| Turborepo    | 2       | Task orchestration & caching                  |
| pnpm         | 10      | Workspaces, pinned via `packageManager`       |
| ESLint       | 9       | Flat config                                   |
| Prettier     | 3       | With Tailwind class sorting                   |

## Repository Structure

```text
.
├── apps/
│   ├── web/     # Next.js 16 application
│   └── docs/    # Documentation site (placeholder)
├── packages/
│   ├── ui/                  # Shared component library (shadcn/ui + Base UI)
│   ├── eslint-config/       # Shared ESLint flat configs
│   └── typescript-config/   # Shared tsconfig presets
└── docs/                    # Architecture decisions (ADRs) & references
```

## Getting Started

### Prerequisites

- **Node.js** 20+ (latest LTS recommended)
- **pnpm** via [Corepack](https://nodejs.org/api/corepack.html) — run
  `corepack enable`

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev   # starts the app at http://localhost:3000
```

## Commands

Run from the repo root.

### Whole repo

| Command          | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `pnpm dev`       | Start all dev servers (web → <http://localhost:3000>) |
| `pnpm build`     | Build everything                                      |
| `pnpm lint`      | Lint the workspace (fails on any warning)             |
| `pnpm typecheck` | Type-check the workspace                              |
| `pnpm format`    | Format the whole repo (`turbo format` also works)     |

### A single package (e.g. `web`)

```bash
# Build / lint / typecheck one package (via Turbo, cached):
pnpm exec turbo build --filter=web
pnpm exec turbo lint --filter=web
pnpm exec turbo typecheck --filter=web

# Run a package's own script directly (no Turbo layer):
pnpm --filter web dev

# Format only part of the tree (Prettier is path-based, not per-package):
pnpm exec prettier --write apps/web
```

Filterable package names: `web`, `@workspace/ui`, `@workspace/eslint-config`,
`@workspace/typescript-config`.

## Usage

Add shadcn/ui components into the shared `ui` package, targeting the web app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Then import them anywhere:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Documentation

- **[Architecture Decisions (ADRs)](docs/decisions/)** — the _why_ behind key
  technical and process choices.
- **[References](docs/references.md)** — curated tools, templates, and docs used
  to build this repo.

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
[Base UI](https://base-ui.com), and [Tailwind CSS](https://tailwindcss.com).
