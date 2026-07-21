# 0017. Branch protection (PR-only `main`) + CodeQL scanning; defer paid Code Quality

- **Status:** Accepted
- **Date:** 2026-07-20

## Context

After the first push, GitHub flagged that `main` was **unprotected** — anyone with
write access (or a leaked token) could force-push, delete it, or merge an unchecked
PR. We want two enterprise guarantees:

1. **No direct commits to `main`** — every change goes through a branch + PR.
2. **Code quality attached to every PR** — automated checks, not just human review.

[0009](0009-github-automation-and-governance.md) deferred branch protection, noting
CI + CODEOWNERS _"only gate merges once branch protection is enabled."_ This ADR
enables it and adds automated scanning.

We also evaluated **GitHub Code Quality**, which reached GA on **2026-07-20**
(CodeQL + AI-assisted maintainability detection, Copilot Autofix, coverage,
dashboards). It is **paid** (~$10/active committer/month per repo + AI usage +
Actions minutes) and only on **Team / Enterprise Cloud** plans — not available on
our current free public-repo plan.

## Decision

### 1. Branch protection via a **ruleset** on `main`

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

### 2. **CodeQL** code scanning (free) — `.github/workflows/codeql.yml`

Free for public repos. Runs on every PR into `main`, on push, and weekly. Uses the
`security-and-quality` query suite (maintainability + reliability on top of
security) — the **free approximation of "code quality on every PR."** Actions are
SHA-pinned per [0009](0009-github-automation-and-governance.md).

### 3. **Defer** the paid GitHub Code Quality product

Its value (AI maintainability detection, Autofix, coverage, org dashboards) is real,
but it needs a **paid Team/Enterprise plan**. Our **CI gate**
(prettier + ESLint `--max-warnings 0` + typecheck + build + `pnpm audit`) plus
**CodeQL** already deliver enforced per-PR quality **for free**. Revisit if/when we
move to a paid plan.

## Consequences

- **Everyone — including maintainers — works on a branch and opens a PR.** No more
  direct commits to `main` (this repo's earlier direct-to-`main` commits predate the
  policy).
- CI + CodeQL become **merge gates**, not just signals.
- **Dependabot** PRs must pass the checks to merge; enable **auto-merge** so green
  grouped/cooled-down updates land without manual clicks.
- CodeQL results surface in the repo **Security** tab and inline on PRs.
- The ruleset lives in GitHub settings — version it by exporting to JSON.
