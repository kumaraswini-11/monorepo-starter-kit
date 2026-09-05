# 0007. GitHub automation, governance & branch protection

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The repo needs a GitHub-side contribution, CI, and supply-chain baseline that is
enterprise-standard but not over-built for its current early, small size.

**Branch protection (added 2026-07-20).** After the first push, GitHub flagged that
`main` was **unprotected** — anyone with write access (or a leaked token) could
force-push, delete it, or merge an unchecked PR. We want two enterprise guarantees:

1. **No direct commits to `main`** — every change goes through a branch + PR.
2. **Code quality attached to every PR** — automated checks, not just human review.

The CI + CODEOWNERS baseline below only **gates** merges once branch protection is
enabled; the branch-protection ruleset and CodeQL scanning (also below) enable it and
add automated scanning.

We also evaluated **GitHub Code Quality**, which reached GA on **2026-07-20**
(CodeQL + AI-assisted maintainability detection, Copilot Autofix, coverage,
dashboards). It is **paid** (~$10/active committer/month per repo + AI usage +
Actions minutes) and only on **Team / Enterprise Cloud** plans — not available on
our current free public-repo plan.

## Decision

### CI — `.github/workflows/ci.yml`

One job, on push to `main` + all PRs, running `prettier --check` →
`turbo run lint typecheck build` → `pnpm audit --prod` (report-only). Hardened per
GitHub's security guidance:

- `permissions: contents: read` (least privilege)
- third-party actions **pinned to a full commit SHA** (human version in a trailing
  comment)
- `persist-credentials: false`, `timeout-minutes`, and concurrency-cancel
- pnpm via the `packageManager` field, **Node 24 LTS** (pinned via
  `node-version-file: .nvmrc`; supersedes the initial Node 22 — see the 2026-08-16
  refinement below), `pnpm install --frozen-lockfile`

A **single job** (not parallel per-check) is intentional — cheaper and simpler at
this size, and Turbo parallelizes internally.

### CODEOWNERS — `.github/CODEOWNERS`

An explicit ownership map (default + per area + governance/legal/security). Solo
owner today, with the team each area should grow into documented;
teams-over-individuals is the target.

### PR template — `.github/pull_request_template.md`

Kept minimal (summary + checklist).

### Dependabot — `.github/dependabot.yml`

`github-actions` + `npm` (the `npm` ecosystem covers pnpm — Dependabot auto-detects
`pnpm-lock.yaml`), weekly. Minor/patch bumps are **grouped** into one PR per
ecosystem to cut noise; **major** bumps stay ungrouped for individual review. A
**cooldown** lets new releases age before a PR opens (majors 30d), mirroring the pnpm
`minimumReleaseAge` supply-chain posture (`pnpm-workspace.yaml`). **Auto-merge** is
enabled so green, grouped/cooled-down Dependabot updates land without manual clicks —
they still must pass the required status checks (branch protection, below) to merge.

### Branch protection via a **ruleset** on `main`

Rulesets (not classic branch protection) — they layer, scale to org level, and have
an "evaluate" mode. Rules:

| Rule                                       | Now    | Note                                                                                        |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| Require a **pull request** before merging  | ✅     | This is what forbids direct pushes to `main`.                                               |
| Require **status checks** (CI + CodeQL)    | ✅     | Merge blocked unless checks pass.                                                           |
| Require branch **up to date** before merge | ✅     | Prevents "passed but broke main."                                                           |
| Require **conversation resolution**        | ✅     | —                                                                                           |
| Block **force-push** / **deletion**        | ✅     | Pure safety, zero friction.                                                                 |
| Required **approvals**                     | 0 → 1+ | 0 while solo (can't self-approve); raise to 1+ and enforce Code Owner review as team grows. |
| Linear history / signed commits            | opt    | Nice-to-have; revisit.                                                                      |

The ruleset is a **GitHub-side setting**, not a repo file. Once created, **export it
to JSON and commit it** (e.g. `.github/rulesets/`) for versioned, auditable
config-as-code.

### **CodeQL** code scanning (free) — `.github/workflows/codeql.yml`

Free for public repos. Runs on every PR into `main`, on push, and weekly. Uses the
`security-and-quality` query suite (maintainability + reliability on top of
security) — the **free approximation of "code quality on every PR."** Actions are
SHA-pinned as in the CI workflow above.

### **Defer** the paid GitHub Code Quality product

Its value (AI maintainability detection, Autofix, coverage, org dashboards) is real,
but it needs a **paid Team/Enterprise plan**. Our **CI gate**
(prettier + ESLint `--max-warnings 0` + typecheck + build + `pnpm audit`) plus
**CodeQL** already deliver enforced per-PR quality **for free**. Revisit if/when we
move to a paid plan.

## Consequences

- **Everyone — including maintainers — works on a branch and opens a PR.** No more
  direct commits to `main` (this repo's earlier direct-to-`main` commits predate the
  policy).
- CI + CodeQL become **merge gates**, not just signals. CI and CODEOWNERS only
  **gate** merges once **branch protection** is enabled on `main` (a GitHub setting) —
  now enabled via the ruleset above (originally deferred and tracked in
  [../future-improvements.md](../future-improvements.md)).
- CodeQL results surface in the repo **Security** tab and inline on PRs.
- The ruleset lives in GitHub settings — version it by exporting to JSON.
- **Dependabot** PRs must pass the required checks to merge (auto-merge is configured
  in the Dependabot section above); the action SHA-pins stay current via Dependabot.
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
- _Refined 2026-08-16:_ CI Node is pinned via `node-version-file: .nvmrc` (Node 24
  LTS — supersedes the "Node 22" above); Dependabot `npm` cadence → **quarterly** with
  `ignore` rules for the deferred tooling majors (TypeScript 7 / ESLint 10 /
  `@eslint/js` / `@types/node`) — see [0006](0006-defer-typescript-7-and-eslint-10.md)
  and the `.github/dependabot.yml` comments.

## See also

- [0004](0004-formatting-prettier-and-import-order.md) — the `prettier --check` step
  in the CI gate.
- [0005](0005-lint-gate-and-vendored-exception.md) — the ESLint `--max-warnings 0`
  hard gate that CI enforces.
- [0006](0006-defer-typescript-7-and-eslint-10.md) — the deferred tooling majors that
  Dependabot `ignore`s.
- [../future-improvements.md](../future-improvements.md).
