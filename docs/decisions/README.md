# Architecture Decision Records (ADRs)

This directory records notable technical and process decisions for
**monorepo-starter-kit** — the _context_, the _decision_, and its
_consequences_. It is the answer to "why is it done this way?" for anyone
(including future-you) reading the repo later.

Format: lightweight [MADR](https://github.com/adr/madr) /
[ADR](https://adr.github.io/). To add a decision, copy the structure and
numbering of an existing record (`NNNN-short-title.md`) and add a row below.

| #                                                  | Decision                                                                 | Status   | Date       |
| -------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ---------- |
| [0001](0001-proprietary-license-unlicensed.md)     | Proprietary license (`UNLICENSED`)                                       | Accepted | 2026-07-12 |
| [0002](0002-root-level-prettier.md)                | Run Prettier once from the repo root (not per-package)                   | Accepted | 2026-07-12 |
| [0003](0003-hard-lint-gate.md)                     | Hard lint gate (`--max-warnings 0`)                                      | Accepted | 2026-07-12 |
| [0004](0004-defer-typescript-7.md)                 | Stay on TypeScript 5.x / ESLint 9; defer TS 7 & ESLint 10                | Accepted | 2026-07-12 |
| [0005](0005-follow-shadcn-baseline.md)             | Decision-making methodology (shadcn baseline → docs → enterprise choice) | Accepted | 2026-07-12 |
| [0006](0006-contributing-security-docs.md)         | Community-oriented CONTRIBUTING & SECURITY from templates                | Accepted | 2026-07-12 |
| [0007](0007-base-ui-over-radix.md)                 | Use Base UI (over Radix) for component primitives                        | Accepted | 2026-07-12 |
| [0008](0008-no-publishconfig-internal-packages.md) | No publishConfig on internal packages (npm publish ≠ repo/license)       | Accepted | 2026-07-12 |
| [0009](0009-github-automation-and-governance.md)   | GitHub automation & governance (CI, CODEOWNERS, PR template, Dependabot) | Accepted | 2026-07-12 |

See also [../references.md](../references.md) for the sources behind these
decisions, and [../future-improvements.md](../future-improvements.md) for the
deliberately-deferred backlog.
