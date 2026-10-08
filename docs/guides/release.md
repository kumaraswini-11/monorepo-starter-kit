# Release

Governing decisions: [0002](../decisions/0002-proprietary-license-and-package-posture.md)
(nothing is published), [0037](../decisions/0037-git-hooks-commit-governance-and-pr-gates.md)
(Conventional Commits, squash merges).

## Today

- **Nothing is published to a registry.** Every package is `private` and `UNLICENSED`; the
  `catalog:` / `workspace:` protocols are replaced with real ranges only on `pnpm publish`, which
  is never run.
- **`main` is the release branch.** Every merge is a squash commit with a Conventional Commit
  title; history is linear (ruleset). A deployment, when one exists, deploys `main`.
- **Versions** in package manifests are placeholders (`0.0.0` / `0.0.1`) and are not bumped.

## When a changelog or version is wanted

Pick one of the two officially supported non-publishing flows and record it in an ADR:

- **release-please** — reads Conventional Commits, opens a release PR with a CHANGELOG and tags
  a GitHub release on merge; explicitly does not publish; manifest mode for monorepos.
- **Changesets** with `privatePackages: { version: true, tag: true }` — contributor-written
  change notes, a "Version Packages" PR; also no publishing.

Prerequisites already in place: Conventional Commit titles are enforced (`pr-title.yml` +
commitlint) and merges are squash-only, which is what both tools recommend.

## If a package is ever published

Flip `private`, add `publishConfig`, choose a versioning flow (Changesets is the usual
monorepo choice), and revisit the licence (ADR 0002) — in that order, with an ADR.
