# 0004. Formatting — root Prettier + import ordering

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

Two related formatting decisions, both owned by a single Prettier run from the
repo root.

### Root vs per-package Prettier

The shadcn `next-monorepo` template ships per-package `format` scripts
(`prettier --write "**/*.{ts,tsx}"`) plus a `turbo format` task with
`dependsOn: ["^format"]`. That approach:

- misses non-`ts/tsx` files (`.css`, `.json`, `.md`, `.yaml`) and root-level
  files (they belong to no package),
- reformats generated files (e.g. `.next/**`) because per-package runs don't
  pick up the root `.prettierignore`,
- adds a meaningless topological order (`^format`) — formatting isn't
  dependency-ordered.

### Import ordering

We want consistent, automatic import ordering (less diff noise, easier reading).
Neither the shadcn nor create-turbo base configs ship an import-order rule, so
this was a genuine gap. The tools split across two layers — a **Prettier plugin**
or an **ESLint rule** — and you must pick **one** (running both makes them fight;
note that `eslint-config-prettier` does _not_ arbitrate import sorters).

| Tool                                      | Layer           | Notes                                                                                                          |
| ----------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| **`@ianvs/prettier-plugin-sort-imports`** | Prettier plugin | ✅ **Chosen.** ~1.8M weekly downloads, actively maintained, preserves side-effect imports, Tailwind-compatible |
| `eslint-plugin-simple-import-sort`        | ESLint rule     | Great, fast lint-gate sorter — but needs `eslint --fix` ergonomics (IDE / pre-commit hooks) we deferred        |
| `eslint-plugin-import` (`import/order`)   | ESLint rule     | Most powerful/configurable, but resolver-based (slow in a monorepo) and only worth it if using its other rules |
| `eslint-plugin-perfectionist`             | ESLint rule     | Broader sorting (imports + objects + types); heavier than needed                                               |
| `@trivago/prettier-plugin-sort-imports`   | Prettier plugin | The original — **archived 2026**, with pnpm / Prettier-3 issues                                                |

## Decision

### Run Prettier once from the repo root (not per-package)

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

### Import ordering via `@ianvs/prettier-plugin-sort-imports`

Use **`@ianvs/prettier-plugin-sort-imports`**, configured in `.prettierrc`:

- `plugins`: sort-imports **first**, `prettier-plugin-tailwindcss` **last**
  (required; our JSON `.prettierrc` avoids the known JS-config conflict between them).
- `importOrder`: builtins → framework (react/next) → third-party → `@workspace/*`
  → local (`@/`, relative). Side-effect imports (e.g. `globals.css`) are preserved.

**Why the Prettier plugin over the ESLint rules:** on a pure "ESLint best-fit"
ranking, `import/order` scores highest for raw power — but that is the wrong
optimization here. **Prettier owns our formatting** (this ADR), and import
ordering is a formatting concern, so it belongs with Prettier: it sorts
automatically on `pnpm format` and is checked by `prettier --check` in CI, with
**no new workflow**. The ESLint-rule route would need `eslint --fix` ergonomics
(IDE-on-save / pre-commit hooks) we deliberately deferred, and would split
formatting across two tools — keeping it out of the lint gate
([0005](0005-lint-gate-and-vendored-exception.md)).

**Why `@ianvs` specifically:** the more-downloaded `@trivago` original is archived
(2026) with pnpm/Prettier-3 problems; `@ianvs` is the actively-maintained fork
(~1.8M downloads/week) that also preserves side-effect imports by default.

## Consequences

- Complete, consistent coverage across all file types and root files; respects
  the root `.prettierignore` (no more formatting generated output).
- Both `pnpm format` and `turbo format` work; there are no per-package format
  tasks.
- Formatting is always **whole-repo**. To format only part of the tree, call
  Prettier with a path (e.g. `prettier --write apps/web`) — `--filter` does not
  scope a root task.
- Imports are sorted on every `pnpm format` and gated by `prettier --check` in CI
  (a formatting check, distinct from the lint gate in
  [0005](0005-lint-gate-and-vendored-exception.md)).
- **Future path:** if we later prefer an ESLint-based sorter (e.g.
  `simple-import-sort`, or `import/order` once we adopt `eslint-plugin-import`'s
  other rules), first **remove `@ianvs` from `.prettierrc`** — never run two
  sorters at once. This pairs with the deferred IDE-on-save / pre-commit-hook work
  in [../future-improvements.md](../future-improvements.md).
- **Evidence:** Turborepo's own `create-turbo` starter formats root-level, not
  per-package (see [../references.md](../references.md)). When the tool authors
  and the template disagree, we follow the tool authors — see
  [0001](0001-decision-making-methodology.md).
