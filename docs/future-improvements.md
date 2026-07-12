# Future Improvements

A single place for everything we **consciously deferred** at this early stage, so
it can be reviewed and picked up as the project (and team) grows. Nothing here is
broken — these are intentional "not yet" items.

See the [Architecture Decision Records](decisions/) for the _why_ behind what we
already built.

## CI / CD

- **Testing job** — add Vitest (unit/component) + Playwright (e2e) and a `test`
  step in CI, then a report-only coverage job that later flips to thresholds.
- **Turbo remote caching** — set `TURBO_TOKEN` / `TURBO_TEAM` (Vercel) to share the
  build/lint cache across CI runs.
- **Parallel CI jobs** — currently one job (cheapest at this size); split into
  per-check jobs (lint / typecheck / build / test / security) if the repo grows.
- **Preview deployments** — a per-PR preview (Vercel or similar).
- **Release automation** — Changesets for versioning + changelogs, _if_ any package
  is ever published.
- **Deeper security scanning** — OpenSSF Scorecard, CodeQL, and
  `dependency-review-action` on PRs (free on public repos).
- **Workflow lockfile** — adopt GitHub's upcoming `dependencies:` block (2026
  roadmap) to pin transitive action SHAs once it is GA.

## Pull requests & developer experience

- **Ticket linking (Linear / Jira / …)** — connect PRs to issues:
  - Install the **Linear** or **Jira** GitHub app (auto-links PRs and syncs status).
  - Adopt a branch/commit convention, e.g. `feat/PROJ-123-short-desc` and
    `Closes PROJ-123` in the PR body.
  - Add a "Related ticket" line to the PR template once a tracker is chosen.
- **Issue templates** — `.github/ISSUE_TEMPLATE/` (bug + feature forms) with a
  `config.yml` that routes security reports to `SECURITY.md`.
- **PR title / commit linting** — commitlint + a Conventional-Commit PR-title check;
  Husky + lint-staged for pre-commit format/lint.
- **Auto-labeling** — `actions/labeler` to label PRs by the paths they touch.

## Repository governance (GitHub settings — after first push)

- **Branch protection / ruleset on `main`** — require a PR, require the CI check to
  pass, require Code Owner review, disallow force-push. **This is what makes CI +
  CODEOWNERS actually gate.**
- Set **`main` as the default branch** on GitHub.
- Replace the CODEOWNERS placeholder owner with real **teams** as they form.
- Consider **required signed commits**.

## App & framework hardening (from the initial review)

- `next.config.ts` — security headers (CSP / HSTS / …), `poweredByHeader: false`,
  `images` config, stable `typedRoutes`.
- `app/layout.tsx` — a `metadata` export (title / description / Open Graph).
- **Accessibility** — add `eslint-plugin-jsx-a11y`.
- **Node pinning** — `.nvmrc` + align `@types/node` + tighten `engines`.
- **DX files** — `.editorconfig`, `.vscode/{settings,extensions}.json`,
  `.env.example`.
- Remove the unused `zod` dependency (or adopt it for form validation).

## Dependency / tooling upgrades (deferred on ecosystem readiness)

See [decisions/0004](decisions/0004-defer-typescript-7.md).

- **TypeScript 7** — adopt when typescript-eslint supports it (~7.1).
- **ESLint 10** — adopt when `eslint-plugin-react` / `eslint-config-next` declare
  support.
- **pnpm 11** — adopt for its security-by-default (`minimumReleaseAge`,
  `blockExoticSubdeps`, `strictDepBuilds` all default-on). **Requires Node ≥ 22.13**,
  so bump `engines` and `@types/node` to `^22` in the same change. Attempted
  2026-07-12 but blocked in the Windows dev env: Corepack could not write its shim
  (`EPERM` on `C:\Program Files\nodejs`, needs admin) and pnpm's self-managed
  pnpm-11 launcher failed. Do it where Corepack can activate (an elevated
  `corepack enable`, or a repaired Node/Corepack install), then bump
  `packageManager` → `pnpm@11`, re-install, verify, and commit.

## Production readiness (when this backs a real product)

- Error monitoring (e.g. Sentry), analytics, structured logging.
- A "Safe Harbor" clause in `SECURITY.md`.
- License review before any public/open-source release (currently proprietary — see
  [decisions/0001](decisions/0001-proprietary-license-unlicensed.md)).
