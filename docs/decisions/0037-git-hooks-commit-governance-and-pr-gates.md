# 0037. Git hooks, commit governance & PR gates — husky + lint-staged + commitlint, PR-title check, dependency review, rulesets

- **Status:** Accepted (amends [0004](0004-formatting-prettier-and-import-order.md) and [0010](0010-agent-skills-vendoring.md), which deferred pre-commit; extends [0007](0007-github-automation-governance-and-branch-protection.md))
- **Date:** 2026-10-07

## Context

[0004](0004-formatting-prettier-and-import-order.md) and [0010](0010-agent-skills-vendoring.md)
deliberately deferred pre-commit hooks "for now"; Conventional Commits were a convention in
CONTRIBUTING.md with nothing enforcing them; `main` had no ruleset; the only PR-time
supply-chain signal was an advisory `pnpm audit`. Format failures were the most common CI
round-trip, and a squash-merge title that is not a Conventional Commit silently breaks the
history that any future changelog or release tooling would read.

## Decision

1. **Local hooks are a convenience; CI and the ruleset are the gate.** husky 9 (`prepare:
husky`, `HUSKY=0` in CI) runs:
   - `pre-commit` → lint-staged: `eslint --max-warnings 0 --no-warn-ignored --fix` then
     `prettier --write` on staged package sources, `prettier --write --ignore-unknown` on
     everything else (sequential per file; no overlapping globs).
   - `commit-msg` → commitlint with `@commitlint/config-conventional`.
     Hooks are bypassable (`--no-verify`); that is acceptable because every check also runs in CI.
2. **PR titles are validated** by `amannn/action-semantic-pull-request` (types mirror the
   commitlint config) on `pull_request_target` with read-only permissions and **no checkout** —
   the documented safe pattern; with squash merges the title is the commit on `main`.
3. **Dependency review** (`actions/dependency-review-action`) blocks a PR that introduces a
   high/critical vulnerability or a copyleft licence (AGPL/GPL/LGPL/SSPL — the product is
   proprietary, [0002](0002-proprietary-license-and-package-posture.md)). `pnpm audit` in CI
   now **blocks on high/critical** advisories in production dependencies; an advisory with no
   patched version is recorded explicitly (and commented) in `auditConfig.ignoreGhsas` rather
   than silenced with `--ignore-unfixable`, which writes ignores and exits 0 without reporting
   the fixable ones.
4. **The `main` ruleset is committed** as importable JSON (`.github/rulesets/main.json`): PR
   required, strict status checks for every CI job plus CodeQL, dependency review and PR title,
   conversation resolution, linear history, squash only, no force-push or deletion. Approvals
   stay at 0 while the repo is solo; raise to 1+ and enable Code-Owner review as the team forms.
   Applying it (and enabling Dependabot alerts + security updates, squash-merge default,
   delete-branch-on-merge, and the "require SHA pinning" Actions policy) is a repository-settings
   action for the owner.
5. **Templates**: issue forms (bug, feature) with blank issues disabled and a security contact
   link; the PR template lists the full gate including knip.

## Consequences

- **Positive:** format/lint failures are caught before the push; commit history is machine-
  readable; supply-chain problems are caught at PR time, not after merge; governance is
  versioned and reusable by a derived repo.
- **Negative / accepted:** `prepare` runs on every install (husky is a no-op with `HUSKY=0`);
  Dependency review and CodeQL need a GitHub Code Security licence on a private repository —
  documented in each workflow header so a derived private repo knows what to drop or license.
- **Alternatives considered:** simple-git-hooks (zero-dep; rejected only for documentation
  ubiquity — Prettier and commitlint docs reference husky); lint-staged per-package configs
  (unnecessary: ESLint 10 resolves config per file directory); release-please / Changesets for
  changelogs — deferred until something needs a changelog (nothing is published).

## References

- husky: <https://typicode.github.io/husky/get-started.html>; lint-staged:
  <https://github.com/lint-staged/lint-staged>; commitlint: <https://commitlint.js.org/guides/getting-started.html>
- Prettier pre-commit guidance: <https://prettier.io/docs/precommit>
- amannn/action-semantic-pull-request: <https://github.com/amannn/action-semantic-pull-request>
- Dependency review: <https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review>
- Rulesets: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets>
- Actions hardening: <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions>
