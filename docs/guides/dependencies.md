# Dependencies

Governing decisions: [0034](../decisions/0034-single-version-dependency-policy.md) (single
version, catalog), [0033](../decisions/0033-toolchain-version-policy-and-2026-10-modernization.md)
(pins & upgrade triggers), [0007](../decisions/0007-github-automation-governance-and-branch-protection.md) (Dependabot).

## The rules

- **Declared once.** Every third-party dependency lives in the `pnpm-workspace.yaml` catalog,
  grouped with a one-line reason; manifests reference `catalog:` only (`catalogMode: strict`).
- **Weigh it by where it runs.** Client runtime deps are the only place bundle size matters
  (prefer small / tree-shakeable, lazy-load heavy ones). Dev tooling never ships — weigh it on
  maintenance and supply chain. Justify every addition in the PR.
- **Prefer maintained, widely used packages.** New versions wait 24h (`minimumReleaseAge`);
  lifecycle scripts run only when allow-listed (`allowBuilds`); exotic (git/URL) transitive
  deps are blocked; a resolution that drops provenance fails (`trustPolicy`).
- **pnpm only.** Inside the repo use `pnpm` and `pnpm dlx`; `npx` will refuse the pinned
  runtime declaration by design.

## Add

```bash
pnpm add --filter <package> --catalog <dep>          # runtime dependency
pnpm add --filter <package> --catalog -D <dep>       # dev dependency
```

Then place the new catalog line in the right group with a comment, and run `pnpm knip`
(it reports unused catalog entries and unlisted imports).

## Bump

1. Read the package's **official changelog / release notes** (mandatory for a major).
2. Change the catalog range (families move together: Vitest + `@vitest/*`, Storybook +
   `@storybook/*`, Playwright test + driver, turbo + `@turbo/gen` + `eslint-plugin-turbo`,
   React + Next + `@types/react`). `pnpm install`, then `pnpm dedupe --check`.
3. Run the full gate: `pnpm format && pnpm lint && pnpm typecheck && pnpm build && pnpm test`
   (+ `pnpm exec turbo run build:storybook test --filter=storybook` if UI-affecting).
4. A major that changes how we work gets an ADR; a deferred major gets a named trigger in
   `future-improvements.md` and a Dependabot `ignore` entry.

`pnpm deps:check` (taze) previews what is outdated without writing. Dependabot version updates
are a template switch (`.github/dependabot.yml.template`, see AGENTS.md); once enabled they open
grouped minor/patch PRs monthly and one PR per major; **verify, never blind-merge**.

## Remove

Delete the manifest reference, `pnpm install`, then `pnpm knip` to catch the orphaned catalog
entry.

## Security

- Dependabot alerts + security updates (repository setting) are the after-the-fact signal.
- `dependency-review` blocks a PR that introduces a high/critical advisory or a copyleft
  licence; `pnpm audit --prod --audit-level=high` blocks high/critical advisories in CI. Fix by
  bumping, or pin a transitive with `overrides` (record the GHSA id); only an advisory with no
  patched version goes into `auditConfig.ignoreGhsas`, with a comment and a removal condition.
- `peerDependencyRules.allowedVersions` only for peer ranges you have verified are merely
  stale; every entry names its removal trigger.
