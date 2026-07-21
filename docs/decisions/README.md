# Architecture Decision Records (ADRs)

This directory records notable technical and process decisions for
**monorepo-starter-kit** — the _context_, the _decision_, and its
_consequences_. It is the answer to "why is it done this way?" for anyone
(including future-you) reading the repo later.

Format: lightweight [MADR](https://github.com/adr/madr) /
[ADR](https://adr.github.io/). To add a decision, copy the structure and
numbering of an existing record (`NNNN-short-title.md`) and add a row below.

| #                                                  | Decision                                                                     | Status   | Date       |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-proprietary-license-unlicensed.md)     | Proprietary license (`UNLICENSED`)                                           | Accepted | 2026-07-12 |
| [0002](0002-root-level-prettier.md)                | Run Prettier once from the repo root (not per-package)                       | Accepted | 2026-07-12 |
| [0003](0003-hard-lint-gate.md)                     | Hard lint gate (`--max-warnings 0`)                                          | Accepted | 2026-07-12 |
| [0004](0004-defer-typescript-7.md)                 | Stay on TypeScript 5.x / ESLint 9; defer TS 7 & ESLint 10                    | Accepted | 2026-07-12 |
| [0005](0005-follow-shadcn-baseline.md)             | Decision-making methodology (shadcn baseline → docs → enterprise choice)     | Accepted | 2026-07-12 |
| [0006](0006-contributing-security-docs.md)         | Community-oriented CONTRIBUTING & SECURITY from templates                    | Accepted | 2026-07-12 |
| [0007](0007-base-ui-over-radix.md)                 | Use Base UI (over Radix) for component primitives                            | Accepted | 2026-07-12 |
| [0008](0008-no-publishconfig-internal-packages.md) | No publishConfig on internal packages (npm publish ≠ repo/license)           | Accepted | 2026-07-12 |
| [0009](0009-github-automation-and-governance.md)   | GitHub automation & governance (CI, CODEOWNERS, PR template, Dependabot)     | Accepted | 2026-07-12 |
| [0010](0010-import-ordering.md)                    | Import ordering via `@ianvs/prettier-plugin-sort-imports`                    | Accepted | 2026-07-12 |
| [0011](0011-project-mcp-servers.md)                | Project MCP servers (github, context7, shadcn, next-devtools, better-auth)   | Accepted | 2026-07-12 |
| [0012](0012-agents-md-single-source.md)            | AGENTS.md is the single source of truth; CLAUDE.md imports it                | Accepted | 2026-07-12 |
| [0013](0013-vendored-ui-lint-exception.md)         | Relax `react-hooks/set-state-in-effect` for vendored shadcn components       | Accepted | 2026-07-12 |
| [0014](0014-base-ui-adoption.md)                   | Base UI adoption — a11y (jsx-a11y), composition, RTL, forms audit            | Accepted | 2026-07-13 |
| [0015](0015-web-security-headers.md)               | Web security headers baseline + deferred strict CSP                          | Accepted | 2026-07-13 |
| [0016](0016-authentication-strategy.md)            | Authentication strategy — adopt Better Auth (self-hosted), not roll-your-own | Accepted | 2026-07-16 |
| [0017](0017-branch-protection-and-codeql.md)       | Branch protection (PR-only main) + CodeQL scanning; defer paid Code Quality  | Accepted | 2026-07-20 |

See also [../references.md](../references.md) for the sources behind these
decisions, and [../future-improvements.md](../future-improvements.md) for the
deliberately-deferred backlog.
