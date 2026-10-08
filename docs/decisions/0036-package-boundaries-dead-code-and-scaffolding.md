# 0036. Package boundaries, dead-code hygiene & scaffolding — Boundaries tags, knip, `turbo gen package`, no `paths`

- **Status:** Accepted (extends [0016](0016-shared-code-and-package-boundaries.md) §Governance and [0028](0028-app-code-feature-architecture.md))
- **Date:** 2026-10-07

## Context

[0016](0016-shared-code-and-package-boundaries.md) set the dependency direction
(`utils` → domain packages → `ui` → apps) and enforced it with two ESLint rules: no
`@workspace/*/src/**` deep imports, and `utils` must not import internal packages. Everything
else was prose. The audit found three gaps:

- **`paths` self-aliases** in every package (`"@workspace/db/*": ["./src/*"]`) and an app-side
  alias straight into `packages/ui/src`. Both bypass the `exports` map the lint rule protects;
  TypeScript's resolvers honour `exports` and self-name imports natively, and Turborepo states
  that just-in-time packages "cannot use `compilerOptions.paths`".
- **No tooling detected** an undeclared dependency (apps/web imported `server-only` without
  listing it — it resolved only because a dependency happened to hoist it), unused dependencies
  (four in `packages/ui`), or unused files/exports.
- **No sanctioned way to add a package**: a new package was copied by hand from a sibling, which
  is how conventions drift (`@turbo/gen` was installed with no generators).

## Decision

1. **`exports` is the only public surface; no `paths` for workspace packages.** Packages import
   their own modules by package name (self-reference), consumers import public subpaths. The
   only alias left is the app-local `@/*` ([0028](0028-app-code-feature-architecture.md)).
2. **Turborepo Boundaries** declares the direction as data: every package carries a tag in its
   `turbo.json` (`leaf`, `config`, `domain`, `ui`, `app`, `test`) and the root `boundaries`
   block denies the wrong directions (a `ui` package may not depend on `domain`; nothing may
   depend on an `app` or on the e2e harness; `config` and `leaf` depend on nothing internal).
   Its default checks also catch undeclared dependencies and cross-package file imports. The
   feature is experimental, so CI runs it **advisory** (`continue-on-error`) and the ESLint rules
   stay the hard gate; it becomes blocking when Turborepo marks it stable.
3. **knip** runs in CI in both modes (`knip`, `knip --production`): unused files, exports,
   dependencies, binaries and catalog entries. Every exception in `knip.ts` names its reason so
   a new finding is a real one.
4. **`pnpm gen package`** (`turbo/generators`) is the one sanctioned way to create a workspace
   package. It emits a package with the conventions already applied — `@workspace/*` name,
   `private` + `UNLICENSED`, source-only `exports`, shared TypeScript / ESLint / Vitest presets,
   the Boundaries tag, a README and a smoke test — for both kinds (`node`, `react`). Templates
   are excluded from Prettier (Handlebars-wrapped source).
5. **Root tooling files** (the generator, `knip.ts`) are type-checked by a root
   `//#typecheck:tooling` task through a root tsconfig scoped to those files only.

## Consequences

- **Positive:** boundaries are checked by tools rather than reviewers; the first Boundaries run
  found a real phantom dependency and the first knip run removed four unused dependencies;
  a new package takes one command and cannot drift.
- **Negative / accepted:** one more config file per package (`turbo.json` with a tag — four
  lines); Boundaries findings do not block yet (experimental); knip exceptions must be kept
  honest (each has a stated trigger or reason).
- **Rejected:** TypeScript project references / compiled packages (contradict source-only
  packages; Turborepo recommends against them), `eslint-plugin-boundaries` (ESLint-only resolver
  configuration, no catalog awareness), an Nx-style tag engine (0016 non-goal).

## References

- Turborepo Boundaries: <https://turborepo.dev/docs/reference/boundaries>; internal packages:
  <https://turborepo.dev/docs/core-concepts/internal-packages>; generators:
  <https://turborepo.dev/docs/guides/generating-code>
- TypeScript module resolution (`exports`, self-name imports, `paths` guidance):
  <https://www.typescriptlang.org/docs/handbook/modules/reference.html>
- knip: <https://knip.dev/features/monorepos-and-workspaces>, <https://knip.dev/guides/using-knip-in-ci>
