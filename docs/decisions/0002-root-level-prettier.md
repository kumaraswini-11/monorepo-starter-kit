# 0002. Run Prettier once from the repo root (not per-package)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The shadcn `next-monorepo` template ships per-package `format` scripts
(`prettier --write "**/*.{ts,tsx}"`) plus a `turbo format` task with
`dependsOn: ["^format"]`. That approach:

- misses non-`ts/tsx` files (`.css`, `.json`, `.md`, `.yaml`) and root-level
  files (they belong to no package),
- reformats generated files (e.g. `.next/**`) because per-package runs don't
  pick up the root `.prettierignore`,
- adds a meaningless topological order (`^format`) — formatting isn't
  dependency-ordered.

## Decision

Format the whole repo from the root:

```jsonc
// package.json
"format": "prettier --write --cache ."
```

Remove the per-package `format` scripts and the per-package `format` task. The
same root command is also exposed as a Turborepo **Root Task**, so `turbo format`
works consistently alongside `turbo build` / `turbo lint`:

```jsonc
// turbo.json
"//#format": { "cache": false }
```

Entry points: **`pnpm format`** or **`turbo format`** — both run the same root
`prettier --write --cache .`.

## Consequences

- Complete, consistent coverage across all file types and root files; respects
  the root `.prettierignore` (no more formatting generated output).
- Both `pnpm format` and `turbo format` work; there are no per-package format
  tasks.
- Formatting is always **whole-repo**. To format only part of the tree, call
  Prettier with a path (e.g. `prettier --write apps/web`) — `--filter` does not
  scope a root task.
- **Evidence:** Turborepo's own `create-turbo` starter formats root-level, not
  per-package (see [../references.md](../references.md)). When the tool authors
  and the template disagree, we follow the tool authors — see
  [0005](0005-follow-shadcn-baseline.md).
