# 0001. Decision-making methodology (shadcn baseline → official docs → enterprise choice)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The repo is scaffolded from the shadcn `next-monorepo` template. We want to
trust the shadcn team's decisions (they are deliberate) **without** blindly
keeping a default that is demonstrably suboptimal for an enterprise/scalable
app. To stay consistent, every tooling/config question is evaluated the same
way.

## Decision — the evaluation process

For any config, dependency, or convention in question:

1. **Start from the shadcn baseline.** Whatever the shadcn `next-monorepo`
   template ships is the default. Assume it was chosen deliberately, and do not
   change it just because it looks unusual.
2. **Check the authoritative source.** Consult the tool's **official docs** _and_
   the **maintainers' own reference setup** — e.g. Turborepo's `create-turbo`
   starter, the Prettier CLI docs, pnpm settings, ESLint/TypeScript release
   notes, the shadcn changelog. **Verify against the source; never assert from
   memory.**
3. **Judge for an enterprise / scalable app.** If shadcn and the authoritative
   source **agree**, keep the default. If they **disagree**, or the default has
   a concrete drawback at scale (correctness, coverage, maintainability), prefer
   the authoritative / maintainer approach.
4. **Prefer the minimal change.** Adopt the better approach with the smallest
   possible diff. Do not over-engineer or add unrequested scope.
5. **Flag and record.** State the deviation explicitly and capture it as an ADR
   (Context → Decision → Consequences) with links to the evidence.

**Rule of thumb:** when shadcn and the tool's _own maintainers_ disagree, follow
the maintainers.

### Decide-now, adopt-at-trigger

A recurring companion pattern: when a decision is clear but the ecosystem (or the
project's own phase) isn't ready to _act_ on it yet, we still **decide now** —
recording both the decision and a **turnkey adoption playbook** (the exact bump,
migration steps, or wiring, plus the concrete revisit trigger). The point is that
when the trigger fires, adoption is a **lookup, not a re-investigation**: no one
has to re-derive the analysis under time pressure. This keeps deferrals honest
(they carry an explicit trigger, not "someday") and keeps the eventual change a
minimal, pre-reasoned diff.

Examples of this pattern in the ADR set:

- [0006](0006-defer-typescript-7-and-eslint-10.md) — defer TypeScript 7 &
  ESLint 10 with explicit revisit triggers (TS 7.1; plugin peer support) and a
  one-line bump ready to apply.
- [0016](0016-shared-code-and-package-boundaries.md) — the shared-code /
  package-boundary rules decided ahead of the second consumer.
- [0017](0017-backend-architecture-and-migration.md) — the separate-backend
  split decided now, adopted at the migration trigger.
- [0018](0018-rate-limiting-and-secondary-storage.md) — secondary-storage
  (Redis) contract decided ahead of the scale trigger.
- [0023](0023-app-shell-routing-and-boundaries.md) — routing/state/boundary
  decisions recorded ahead of the flows that consume them.
- [0025](0025-testing-strategy.md) — the testing topology decided up front,
  including the separate-backend scenario.

## Consequences

- Every ADR in this folder is an application of this process.
- **Deviations made this way** (evidence-backed, aligned with `create-turbo`):
  root-level Prettier ([0004](0004-formatting-prettier-and-import-order.md)),
  hard lint gate ([0005](0005-lint-gate-and-vendored-exception.md)), and
  removing `publishConfig`
  ([0002](0002-proprietary-license-and-package-posture.md)).
- **Kept as shadcn ships it** (harmless / no evidence to change): the root
  `.eslintrc.js` (inert under ESLint 9 flat config but harmless), per-package
  `lint` / `typecheck`, and the `turbo.json` build/lint/typecheck tasks.
- **Deferred on evidence** (ecosystem not ready): TypeScript 7 & ESLint 10
  ([0006](0006-defer-typescript-7-and-eslint-10.md)) — the canonical
  "Decide-now, adopt-at-trigger" case.
