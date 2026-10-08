# 0034. Single-version dependency policy — every third-party dependency lives in the pnpm catalog

- **Status:** Accepted (extends the catalog convention in AGENTS.md; see also [0007](0007-github-automation-governance-and-branch-protection.md) for Dependabot)
- **Date:** 2026-10-07

## Context

Before this decision the catalog held only dependencies that two or more packages shared;
package-only dependencies were inlined in each manifest. That rule is reasonable for a
two-package repo and breaks down as the workspace grows: the same library gets added to a second
package at a different range, duplicate majors appear silently, and "where do I bump X?" has two
answers. pnpm lists "maintain unique versions" as the first purpose of catalogs, and since
10.12 ships `catalogMode: strict`, which makes the catalog an enforcement mechanism rather than
a convention.

The [2026-10 audit](../audits/2026-10-07-foundation-audit-and-plan.md) inventoried 48 inline
dependencies with no range conflicts — i.e. the move was purely mechanical, and the right moment
to make the policy structural.

## Decision

1. **Every third-party dependency is declared once**, in the `pnpm-workspace.yaml` default
   catalog, grouped by concern with a one-line rationale per group. Manifests reference it as
   `catalog:` only; an inline version is an error (`catalogMode: strict`).
2. **Adding a dependency** is `pnpm add --filter <package> --catalog <dep>`; the generator
   (`pnpm gen package`) emits `catalog:` references only.
3. **Lockstep families** (Vitest + `@vitest/*`, Storybook + `@storybook/*`, Playwright test +
   driver, Turborepo + `@turbo/gen` + `eslint-plugin-turbo`, React + Next + `@types/react`) are
   kept adjacent in the catalog with the reason recorded, because a partial bump of a family has
   caused skew before.
4. **Guards**: `pnpm dedupe --check` in CI (no duplicate resolutions the lockfile could collapse),
   knip reports unused catalog entries, Dependabot edits the catalog directly (catalog support
   is GA), taze (`pnpm deps:check`) previews refreshes.
5. **Exceptions** are declared, not implied: `peerDependencyRules.allowedVersions` for peer
   ranges verified stale (each with its removal trigger), `overrides` for security pins (each
   with its advisory id).

## Consequences

- **Positive:** one bump site for every dependency, no silent duplicate majors across packages,
  a readable inventory of what the product depends on and why, and tooling (Dependabot, taze,
  knip) that operates on one file.
- **Negative / accepted:** `pnpm add` must target the catalog (friction by design); the
  catalog grows with the workspace (~80 entries today) and needs its grouping maintained.
- **Not chosen:** `catalogMode: prefer` (uses the catalog when present, otherwise inlines) —
  it keeps the two-answers problem; named catalogs (e.g. `react18`) — only needed when two
  majors must coexist, which the policy forbids by default.

## References

- pnpm catalogs: <https://pnpm.io/catalogs>; `catalogMode`: <https://pnpm.io/settings/other>
- pnpm `dedupe --check`: <https://pnpm.io/cli/dedupe>
- Dependabot pnpm catalog support (GA 2025-02-04):
  <https://github.blog/changelog/2025-02-04-dependabot-now-supports-pnpm-workspace-catalogs-ga/>
- knip catalogs: <https://knip.dev/features/catalogs>
