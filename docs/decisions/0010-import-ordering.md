# 0010. Import ordering via `@ianvs/prettier-plugin-sort-imports`

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

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

Use **`@ianvs/prettier-plugin-sort-imports`**, configured in `.prettierrc`:

- `plugins`: sort-imports **first**, `prettier-plugin-tailwindcss` **last**
  (required; our JSON `.prettierrc` avoids the known JS-config conflict between them).
- `importOrder`: builtins → framework (react/next) → third-party → `@workspace/*`
  → local (`@/`, relative). Side-effect imports (e.g. `globals.css`) are preserved.

**Why the Prettier plugin over the ESLint rules:** on a pure "ESLint best-fit"
ranking, `import/order` scores highest for raw power — but that is the wrong
optimization here. **Prettier owns our formatting**
([0002](0002-root-level-prettier.md)), and import ordering is a formatting
concern, so it belongs with Prettier: it sorts automatically on `pnpm format` and
is checked by `prettier --check` in CI, with **no new workflow**. The ESLint-rule
route would need `eslint --fix` ergonomics (IDE-on-save / pre-commit hooks) we
deliberately deferred, and would split formatting across two tools.

**Why `@ianvs` specifically:** the more-downloaded `@trivago` original is archived
(2026) with pnpm/Prettier-3 problems; `@ianvs` is the actively-maintained fork
(~1.8M downloads/week) that also preserves side-effect imports by default.

## Consequences

- Imports are sorted on every `pnpm format` and gated by `prettier --check` in CI.
- **Future path:** if we later prefer an ESLint-based sorter (e.g.
  `simple-import-sort`, or `import/order` once we adopt `eslint-plugin-import`'s
  other rules), first **remove `@ianvs` from `.prettierrc`** — never run two
  sorters at once. This pairs with the deferred IDE-on-save / pre-commit-hook work
  in [../future-improvements.md](../future-improvements.md).
