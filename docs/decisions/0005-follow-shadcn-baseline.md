# 0005. Decision-making methodology (shadcn baseline → official docs → enterprise choice)

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

## Consequences

- Every ADR in this folder is an application of this process.
- **Deviations made this way** (evidence-backed, aligned with `create-turbo`):
  root-level Prettier ([0002](0002-root-level-prettier.md)), hard lint gate
  ([0003](0003-hard-lint-gate.md)), and removing `publishConfig`
  ([0008](0008-no-publishconfig-internal-packages.md)).
- **Kept as shadcn ships it** (harmless / no evidence to change): the root
  `.eslintrc.js` (inert under ESLint 9 flat config but harmless), per-package
  `lint` / `typecheck`, and the `turbo.json` build/lint/typecheck tasks.
- **Deferred on evidence** (ecosystem not ready): TypeScript 7 & ESLint 10
  ([0004](0004-defer-typescript-7.md)).
