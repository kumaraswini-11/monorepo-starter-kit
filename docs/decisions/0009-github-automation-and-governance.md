# 0009. GitHub automation & governance (CI, CODEOWNERS, PR template, Dependabot)

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The repo needs a GitHub-side contribution, CI, and supply-chain baseline that is
enterprise-standard but not over-built for its current early, small size.

## Decision

**CI — `.github/workflows/ci.yml`:** one job, on push to `main` + all PRs, running
`prettier --check` → `turbo run lint typecheck build` → `pnpm audit --prod`
(report-only). Hardened per GitHub's security guidance:

- `permissions: contents: read` (least privilege)
- third-party actions **pinned to a full commit SHA** (human version in a trailing
  comment)
- `persist-credentials: false`, `timeout-minutes`, and concurrency-cancel
- pnpm via the `packageManager` field, Node 22, `pnpm install --frozen-lockfile`

A **single job** (not parallel per-check) is intentional — cheaper and simpler at
this size, and Turbo parallelizes internally.

**CODEOWNERS — `.github/CODEOWNERS`:** an explicit ownership map (default + per
area + governance/legal/security). Solo owner today, with the team each area
should grow into documented; teams-over-individuals is the target.

**PR template — `.github/pull_request_template.md`:** kept minimal (summary +
checklist).

**Dependabot — `.github/dependabot.yml`:** `github-actions` + `npm` (the `npm`
ecosystem covers pnpm — Dependabot auto-detects `pnpm-lock.yaml`), weekly.
Minor/patch bumps are **grouped** into one PR per ecosystem to cut noise; **major**
bumps stay ungrouped for individual review. A **cooldown** lets new releases age
before a PR opens (majors 30d), mirroring the pnpm `minimumReleaseAge` supply-chain
posture (`pnpm-workspace.yaml`).

## Consequences

- CI and CODEOWNERS only **gate** merges once **branch protection** is enabled on
  `main` (a GitHub setting) — tracked in
  [../future-improvements.md](../future-improvements.md).
- The action SHA-pins stay current via Dependabot.
- Deferred CI / DX / security enhancements (testing, ticket linking, OpenSSF
  Scorecard, etc.) are consolidated in
  [../future-improvements.md](../future-improvements.md).
- **Division of labor:** Dependabot covers GitHub Actions + root/inlined npm deps;
  **catalog** entries (`next`, `react`, Tailwind, …) are kept fresh by **taze**
  (`pnpm deps:check`), since Dependabot can't read `catalog:` refs and its
  workspace-package coverage for pnpm monorepos is limited.
- Dependabot **security _updates_** aren't available for pnpm (version updates
  only); **Dependabot alerts** should be enabled in repo Settings for vulnerability
  visibility (the report-only `pnpm audit --prod` CI step is the backstop).
- _Refined 2026-07-20:_ added Dependabot update **grouping** + release **cooldown**
  (rationale in the `.github/dependabot.yml` comments).
