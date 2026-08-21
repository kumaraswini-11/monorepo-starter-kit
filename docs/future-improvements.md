# Future Improvements

A single place for everything we **consciously deferred** at this early stage, so
it can be reviewed and picked up as the project (and team) grows. Nothing here is
broken — these are intentional "not yet" items.

See the [Architecture Decision Records](decisions/) for the _why_ behind what we
already built.

## CI / CD

- **Testing** — Vitest (unit) is wired (co-located `src/*.test.ts` per package, run
  by the turbo `test` task). Remaining: a CI **`test` job**, **Playwright** (e2e), a
  report-only **coverage** job that later flips to thresholds, and (if useful) a shared
  `@workspace/vitest-config`. The deeper strategy — DB integration tests + mocking,
  component tests — is designed when those needs land.
- **Turbo remote caching** — set `TURBO_TOKEN` / `TURBO_TEAM` (Vercel) to share the
  build/lint cache across CI runs.
- **Parallel CI jobs** — currently one job (cheapest at this size); split into
  per-check jobs (lint / typecheck / build / test / security) if the repo grows.
- **Preview deployments** — a per-PR preview (Vercel or similar).
- **Release automation** — Changesets for versioning + changelogs, _if_ any package
  is ever published.
- **Deeper security scanning** — OpenSSF Scorecard and `dependency-review-action`
  on PRs (free on public repos). _CodeQL is now enabled — see
  [decisions/0017](decisions/0017-branch-protection-and-codeql.md)._
- **Workflow lockfile** — adopt GitHub's upcoming `dependencies:` block (2026
  roadmap) to pin transitive action SHAs once it is GA.

## Storybook

- The addon trim decision, Chromatic (Phase 3), and publishing (Phase 4) are
  tracked in [decisions/0018](decisions/0018-storybook-and-visual-testing.md).
- **Stories for the promoted molecules** — the shadcn _atoms_ each have a co-located
  `*.stories.tsx`; the form molecules just promoted into `@workspace/ui` (`Form`,
  `SubmitButton`, `FormError`, `FormTextField`/`FormPasswordField`, `PasswordInput`,
  `PasswordStrength`) and the brand `Logo` don't yet
  ([decisions/0022](decisions/0022-shared-code-and-utilities-organization.md) §Component
  placement). RHF-bound molecules need a `useForm` wrapper in the story.

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

- **Branch protection / ruleset on `main`** — policy defined in
  [decisions/0017](decisions/0017-branch-protection-and-codeql.md) (require a PR,
  require CI + CodeQL checks, disallow force-push/deletion); enable it in
  **Settings → Rules → Rulesets**. Raise required approvals 0 → 1+ and enforce Code
  Owner review as the team grows.
- Set **`main` as the default branch** on GitHub.
- Replace the CODEOWNERS placeholder owner with real **teams** as they form.
- Consider **required signed commits**.

## App & framework hardening

Most of the original list is **done**: security headers
([decisions/0015](decisions/0015-web-security-headers.md)), `poweredByHeader: false`,
root `metadata`/`viewport`/`robots`/`manifest`, `eslint-plugin-jsx-a11y`
([decisions/0014](decisions/0014-base-ui-adoption.md)), `.env.example`
([decisions/0021](decisions/0021-env-and-secrets-management.md)), `zod` adopted for
form validation, Node pinning + DX files, and the rendering/perf model
([decisions/0023](decisions/0023-nextjs-rendering-and-performance-model.md)).

Remaining, **deferred with triggers**:

- **`typedRoutes: true`** — commented in `apps/web/next.config.ts`. **Trigger:** all
  auth routes exist (it errors on `<Link>`s to not-yet-created routes). Then uncomment.
- **`useReportWebVitals`** — report real-user Core Web Vitals (LCP/INP/CLS/FCP/TTFB).
  **How:** a `next/web-vitals` client component in the root layout that POSTs metrics.
  **Trigger:** an analytics sink is chosen (otherwise it reports nowhere).
- **SEO for public pages** — `opengraph-image`/`twitter-image`, JSON-LD, canonical
  URLs. **Trigger:** public/marketing pages exist (auth pages stay `noindex`; a
  minimal `sitemap.ts` + `robots` already ship).
- **`forbidden.tsx` / `unauthorized.tsx`** — custom 403/401 UI paired with
  `forbidden()`/`unauthorized()`. **Trigger:** RBAC (auth org/permissions phase).
- **`serverExternalPackages`** — re-check `pg` / `better-auth` server bundling if a
  server-bundle issue ever appears (`next build` is green today).
- **`instrumentation.ts` + tainting (`experimental.taint`)** — **Trigger:** an
  observability backend is chosen / server→client data flows grow.

## Auth flow (wired; later screens deferred)

The auth **UI** is complete and now **wired to Better Auth** (ADR 0027): the app-side seam
(`apps/web/lib/auth/`) injects `signIn.email` / `signUp.email` / `requestPasswordReset` /
`resetPassword` into the steps, routes the email step via a rate-limited identifier-first
existence check, and sends **sign-up → auto-login → `/dashboard`** and **reset → sign in**
(sessions revoked, [decisions/0016](decisions/0016-authentication-strategy.md)). Remaining:

- **Rate-limit / secondary storage** — BA rate-limits its endpoints (incl. the
  `account-exists` plugin) by default, but the store defaults to **in-memory** (per-instance).
  **Decided:** Redis (`secondary-storage`) is the production store, wired at the deploy/scale
  trigger — turnkey steps in
  [decisions/0028](decisions/0028-rate-limiting-and-secondary-storage.md). Dev stays on the
  default (rate limiting is off in dev). Identifier-first is an intentional enumeration
  trade-off (ADR 0027 §3).
- **Change password (Settings)** — a future settings screen needs current + new password
  (± confirm). **Reuse the form layer** (ADR 0025 §2): `FormPasswordField` (with
  `showStrength`), `FormError`, `submitWithFormError`, and the `passwordField` schema rule
  (`PasswordInput` / `PasswordStrength` underlie the field component). If sign-up and
  change-password end up duplicating the "new password + strength" block, extract a shared
  field then (rule of three). Better Auth: `authClient.changePassword({ currentPassword,
newPassword, revokeOtherSessions })`.
- **Verify-email banner, lightweight onboarding, OAuth (Google) callback** — later phases
  per the [auth-ui-ux spec](specs/auth-ui-ux-spec.md) and
  [decisions/0016](decisions/0016-authentication-strategy.md).

## Dependency / tooling upgrades (deferred on ecosystem readiness)

See [decisions/0004](decisions/0004-defer-typescript-7.md).

- **TypeScript 7** — adopt when typescript-eslint supports it (~7.1).
- **ESLint 10** — adopt when `eslint-plugin-react` / `eslint-config-next` declare
  support.
- **pnpm 11** — adopt for its security-by-default (`minimumReleaseAge`,
  `blockExoticSubdeps`, `strictDepBuilds` all default-on). Its **Node ≥ 22.13**
  prerequisite is now **met**: the repo runs **Node 24 LTS** (`engines: >=24`,
  `.nvmrc`, CI via `node-version-file`, and `@types/node ^24` all aligned). The
  remaining blocker is env-specific — attempted 2026-07-12 but blocked in the
  Windows dev env: Corepack could not write its shim (`EPERM` on
  `C:\Program Files\nodejs`, needs admin) and pnpm's self-managed pnpm-11 launcher
  failed. Do it where Corepack can activate (an elevated `corepack enable`, or a
  repaired Node/Corepack install), then bump `packageManager` → `pnpm@11`,
  re-install, verify, and commit.
- **Dependabot noise** — the npm ecosystem runs **quarterly** with the deferred
  majors above **ignored** in `.github/dependabot.yml` (so TS 7 / ESLint 10 stop
  reopening). Remove the relevant `ignore` entry when adopting each.

## Production readiness (when this backs a real product)

- Error monitoring (e.g. Sentry), analytics, structured logging.
- A "Safe Harbor" clause in `SECURITY.md`.
- License review before any public/open-source release (currently proprietary — see
  [decisions/0001](decisions/0001-proprietary-license-unlicensed.md)).
