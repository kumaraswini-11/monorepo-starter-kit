# Architecture Decision Records (ADRs)

This directory records notable technical and process decisions for
**monorepo-starter-kit** — the _context_, the _decision_, and its
_consequences_. It is the answer to "why is it done this way?" for anyone
(including future-you) reading the repo later.

Format: lightweight [MADR](https://github.com/adr/madr) /
[ADR](https://adr.github.io/). To add a decision, copy the structure and
numbering of an existing record (`NNNN-short-title.md`) and add a row below.

The set is organized thematically: **foundations & tooling** (0001–0006),
**repo automation & agent config** (0007–0010), **foundation stack — auth, data,
config, email, security** (0011–0015), **shared code, backend & scaling**
(0016–0018), **front-end, UI & quality** (0019–0025), and **cross-cutting
abstraction & reuse method** (0026, pairs with 0016).

| #                                                                  | Decision                                                                                        | Status   | Date       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-decision-making-methodology.md)                        | Decision-making methodology (shadcn baseline → official docs → enterprise choice)               | Accepted | 2026-07-12 |
| [0002](0002-proprietary-license-and-package-posture.md)            | Proprietary license (`UNLICENSED`) & package-publishing posture                                 | Accepted | 2026-07-12 |
| [0003](0003-contributing-and-security-docs.md)                     | Community CONTRIBUTING & SECURITY docs from established templates                               | Accepted | 2026-07-12 |
| [0004](0004-formatting-prettier-and-import-order.md)               | Formatting — root-level Prettier + import ordering                                              | Accepted | 2026-07-12 |
| [0005](0005-lint-gate-and-vendored-exception.md)                   | Lint gate (`--max-warnings 0`) + vendored-UI exception                                          | Accepted | 2026-07-12 |
| [0006](0006-defer-typescript-7-and-eslint-10.md)                   | Tooling versions — stay on TypeScript 5 / ESLint 9; defer TS 7 & ESLint 10                      | Accepted | 2026-07-12 |
| [0007](0007-github-automation-governance-and-branch-protection.md) | GitHub automation, governance & branch protection (CI, CODEOWNERS, Dependabot, ruleset, CodeQL) | Accepted | 2026-07-12 |
| [0008](0008-agents-md-single-source.md)                            | AGENTS.md is the single source of truth; CLAUDE.md imports it                                   | Accepted | 2026-07-12 |
| [0009](0009-project-mcp-servers.md)                                | Project MCP servers (github, context7, shadcn, next-devtools, better-auth)                      | Accepted | 2026-07-12 |
| [0010](0010-agent-skills-vendoring.md)                             | Agent skills — vendored, hash-pinned, first-party/known-author                                  | Accepted | 2026-08-22 |
| [0011](0011-authentication-strategy.md)                            | Authentication — adopt Better Auth (self-hosted), not roll-your-own                             | Accepted | 2026-07-16 |
| [0012](0012-data-layer-postgres-drizzle.md)                        | Data layer — PostgreSQL + Drizzle; database portability & lock-in strategy                      | Accepted | 2026-08-04 |
| [0013](0013-env-and-secrets-management.md)                         | Environment variables & secrets management (per-app .env, turbo, secrets manager)               | Accepted | 2026-08-04 |
| [0014](0014-email-transactional-messaging.md)                      | Email — React Email + a `sendEmail` port (SMTP/Nodemailer; Resend first provider)               | Accepted | 2026-08-04 |
| [0015](0015-web-security-headers.md)                               | Web security headers baseline + deferred strict CSP                                             | Accepted | 2026-07-13 |
| [0016](0016-shared-code-and-package-boundaries.md)                 | Shared-code organization & package boundaries (utils, ports-and-adapters, component placement)  | Accepted | 2026-08-09 |
| [0017](0017-backend-architecture-and-migration.md)                 | Backend architecture — Next.js fullstack now; separate-backend migration path                   | Accepted | 2026-08-16 |
| [0018](0018-rate-limiting-and-secondary-storage.md)                | Rate limiting & secondary storage — Redis for production, wired at deploy                       | Accepted | 2026-08-17 |
| [0019](0019-nextjs-rendering-and-performance.md)                   | Next.js rendering & performance model — Cache Components (PPR), React 19 form idiom             | Accepted | 2026-08-14 |
| [0020](0020-ui-foundations-layout-responsiveness-accessibility.md) | UI foundations — layout, responsiveness (mobile → TV) & accessibility conventions               | Accepted | 2026-08-15 |
| [0021](0021-base-ui-selection-and-adoption.md)                     | Base UI — selection (over Radix) & adoption audit                                               | Accepted | 2026-07-12 |
| [0022](0022-forms-rhf-submission-and-pending.md)                   | Forms — React Hook Form + zod; submission & pending-state pattern                               | Accepted | 2026-08-15 |
| [0023](0023-app-shell-routing-and-boundaries.md)                   | App shell, routing, state & route boundaries (loading/error/not-found, session guard)           | Accepted | 2026-08-15 |
| [0024](0024-storybook-and-component-testing.md)                    | Storybook (phased) for the UI library — component & visual testing                              | Accepted | 2026-08-01 |
| [0025](0025-testing-strategy.md)                                   | Testing strategy — Vitest + Testing Library, Playwright, real-Postgres integration              | Accepted | 2026-08-22 |
| [0026](0026-choosing-the-right-abstraction.md)                     | Choosing the right abstraction — shape & API of reusable code (defaults + escape hatch)         | Accepted | 2026-08-28 |

See also [../references.md](../references.md) for the sources behind these
decisions, and [../future-improvements.md](../future-improvements.md) for the
deliberately-deferred backlog.
