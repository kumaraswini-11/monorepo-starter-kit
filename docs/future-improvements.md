# Future Improvements

A single place for everything we **consciously deferred** at this early stage, so
it can be reviewed and picked up as the project (and team) grows. Nothing here is
broken — these are intentional "not yet" items.

See the [Architecture Decision Records](decisions/) for the _why_ behind what we
already built.

## CI / CD

- **Testing** — the full strategy is in
  [decisions/0029](decisions/0029-testing-strategy.md) (Vitest + Testing Library,
  Playwright e2e, real-Postgres integration via Testcontainers, `@workspace/vitest-config`,
  Turbo task split, coverage report-only → gated, monorepo/backend-split-aware). **Done:**
  Phase 1 (unit + component + CI test job + coverage), Phase 2 (db **and** auth integration
  vs real Postgres via Testcontainers, sharing the harness at `@workspace/db/testing`, plus a
  CI **integration** job — Testcontainers on the runner), **Phase 3 (e2e)** — a Playwright
  `apps/e2e` workspace + CI job (Postgres service): smoke, protected-route redirect, the full
  **sign-up** and **sign-out** journeys, and a returning-authenticated journey via the
  **`storageState`** pattern (a `setup` project authenticates once), aligned to the vendored
  `playwright-best-practices` skill; and the **Phase 4 MSW seam tests** (ADR 0029 §11 Q4).
  **Remaining (deferred to their triggers — deliberately not built on day one):** a shared
  contract package and flipping coverage report-only → thresholds.
  - **MSW seam tests — done (Phase 4, ADR 0029 §11 Q4).** The seam's HTTP contract
    (enumeration-safe status→error mapping, identifier-first routing) is proven against
    MSW-intercepted `/api/auth/*`, with **no** client internals mocked, so it survives the ADR
    0027 split (only `lib/auth-client.ts`'s baseURL moves). The earlier interception failure was
    root-caused: Better Auth snapshots `globalThis.fetch` into `customFetchImpl` at client
    construction, so the seam is dynamically imported **after** `server.listen()` — under the
    standard jsdom preset, no node-env or bespoke `baseURL` needed.
  - **Shared contract package (deferred — needs a 2nd party).** A zod/OpenAPI contract feeding
    both MSW handlers and provider assertions only earns its keep once a **separate backend or a
    2nd client** exists (ADR 0029 §8.3, §9). Today there is one client and the request/response
    types are already inferred (Better Auth types + the `account-exists` zod schema), so a
    contract package now would be a single-consumer abstraction with no counterparty. Build it at
    the split; full Pact only with a 2nd client/team.
  - **Coverage thresholds (deferred — needs a baseline).** Coverage stays **report-only** until a
    representative baseline exists; gating on day one either fails CI or bakes in a meaningless
    bar (ADR 0029 §7 maturity path). Flip on global thresholds once the suite is broad, then
    tighten to per-package/glob gates.
  - **Shared integration-test harness — done:** the Testcontainers container+migrate+env-inject
    setup + `resetDb()` are exported from `@workspace/db/testing` and reused by both
    `packages/db` and `packages/auth` tests. Extract to a standalone test-support package only
    if a **non-db** consumer ever needs it (ADR 0029 §11).
  - **Better Auth `testUtils()`** — ✅ done: bumped to **1.7.1** and adopted (session
    factories + `login()` from a test-only auth instance). The 1.7 bump also required an
    `account.issuer` column + unique index (BA 1.7 upgrade guide); ADR 0028's Redis
    secondary-storage snippet needs the 1.7 API (`increment` + `getAndDelete`) when wired.
  - **Real-SMTP email integration test (deferred).** The Nodemailer/SMTP adapter (ADR 0020) is
    covered by unit tests (mocked transport). A follow-up should add one integration test that
    starts a **Mailpit** container (Testcontainers `GenericContainer`, image `axllent/mailpit`,
    SMTP 1025 / API 8025), points the adapter's env at it, sends, then asserts receipt via
    Mailpit's `/api/v1/messages` — proving the real connect/TLS/wire path. Add `testcontainers`
    (already in the tree) as a `packages/email` devDep + a `test:integration` script so
    `turbo run test:integration` picks it up automatically.
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
- **Verify-email banner** — ✅ done: `VerifyEmailBanner` in the authed-area layout prompts
  signed-in-but-unverified users with a rate-limited resend; the emailed link is handled by
  BA's route handler (progressive verification, ADR 0016).
- **Lightweight onboarding, OAuth (Google) callback** — later phases per the
  [auth-ui-ux spec](specs/auth-ui-ux-spec.md) and
  [decisions/0016](decisions/0016-authentication-strategy.md). The `/auth` "Continue with
  Google" button is intentionally presentational until then (ADR 0025).

### Auth hardening — deploy-time + follow-ups (from the 2026-08-22 audit)

- **New-device email is on the sign-in critical path.** The `databaseHooks.session.create.after`
  hook (`packages/auth/src/auth.ts`) is awaited by Better Auth, so on a new device it runs a
  query + an SMTP send before the sign-in response returns. Harmless with the console stub, but
  when a real email transport is wired, move the send off the response path (a queue/background
  worker; framework `after()` isn't reachable from the framework-neutral auth package). Pair
  this with the "real email transport" step.
- **Cookie/proxy hardening (deployment-dependent):** set `advanced.useSecureCookies: true` in
  production (guards against a misconfigured `http` `BETTER_AUTH_URL` silently dropping
  `Secure`); and once the trusted proxy is known, set
  `advanced.ipAddress.trustedProxyHeaders: true` together with an `ipv6Subnet` — the leftmost
  `x-forwarded-for` is client-spoofable until strictly behind a
  trusted proxy, which would let a caller poison/bypass the per-IP rate-limit key. Fold into the
  deploy checklist alongside Redis (ADR 0028) and the real email transport.
- **Audit logging (compliance):** beyond the new-device email, a compliance-bound product will
  want durable audit events (sign-in, email change, password reset) via Better Auth
  `databaseHooks`. Not needed yet; recorded so it isn't forgotten.

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
- **Install-time deprecation warnings (benign — no action needed).** `pnpm install`
  prints a few `deprecated` notices; all are either deliberate or upstream-only:
  - `eslint@9.x` "no longer supported" — expected: ESLint marks every pre-10 line
    deprecated now that ESLint 10 shipped, and we deliberately stay on 9 (see the
    ESLint 10 entry above). Bumping within 9.x won't clear it; only the deferred
    major would.
  - `@react-email/components@1.0.12` — upstream deprecated its **own latest** version
    (its siblings `@react-email/render`, `react-email`, `@react-email/ui` are **not**
    deprecated, and there is no newer version to move to). It's a dev-time
    email-template lib; build + typecheck are green. Nothing to action — revisit if
    Resend ships a non-deprecated release.
  - ~25 transitive "subdependencies" (the internal `@react-email/*` tree, plus
    `glob@10`, `uuid@10`, `@esbuild-kit/*`, etc.) and the `valibot@^1.4.0` peer
    warning (isolated inside the dev-only `@storybook/addon-mcp` tree) are **deps of
    deps** — not declared by us and not shippable; they resolve away as those
    upstreams update.

## Production readiness (when this backs a real product)

- Error monitoring (e.g. Sentry), analytics, structured logging.
- A "Safe Harbor" clause in `SECURITY.md`.
- License review before any public/open-source release (currently proprietary — see
  [decisions/0001](decisions/0001-proprietary-license-unlicensed.md)).
