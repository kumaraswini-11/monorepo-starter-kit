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

**Dependabot — `.github/dependabot.yml`:** `github-actions` + `npm`, weekly — keeps
the SHA-pinned actions and the exact-pinned `next`/`react` current.

## Consequences

- CI and CODEOWNERS only **gate** merges once **branch protection** is enabled on
  `main` (a GitHub setting) — tracked in
  [../future-improvements.md](../future-improvements.md).
- The action SHA-pins stay current via Dependabot.
- Deferred CI / DX / security enhancements (testing, ticket linking, OpenSSF
  Scorecard, etc.) are consolidated in
  [../future-improvements.md](../future-improvements.md).
