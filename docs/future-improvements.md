# Future Improvements

A single place for everything we **consciously deferred**, so it can be reviewed and picked up as
the project (and team) grows. Nothing here is broken — these are intentional "not yet" items,
and **every item names its trigger** (a date, a release, or an observable condition). An item
without a trigger does not belong here.

See the [Architecture Decision Records](decisions/) for the _why_ behind what we already built,
the [guides](guides/) for the _how_, and the [2026-10 foundation audit](audits/2026-10-07-foundation-audit-and-plan.md)
for the last full re-evaluation.

## Toolchain upgrades (dated or release-gated — ADR 0033)

| Item                                | Trigger                                                                                                                                    | What to do                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16.4 + React 19.3**       | 16.4.0 was published 2026-10-06T18:35Z; the 24h `minimumReleaseAge` gate clears 2026-10-07T18:35Z                                          | bump `next`, `@next/eslint-plugin-next` → `^16.4.0`, `react`/`react-dom` → `19.3.x`, `@types/react*` → `^19.3.0` together; add `partialPrefetching: true` beside `cacheComponents` (16.4 logs a warning without it); read the [16.4 post](https://nextjs.org/blog/next-16-4); full gate + Storybook + e2e |
| **Node 26 LTS**                     | 2026-10-28 (Active LTS)                                                                                                                    | bump `.nvmrc`, `devEngines.runtime`, `engines.node` (`>=26 <27`), `@types/node` → 26, Dependabot ignore; verify Next, Playwright, Testcontainers, jsdom; CI follows automatically (`pnpm/setup` reads the pin)                                                                                            |
| **pnpm 12** (Rust rewrite)          | dependabot-core issue [#16434](https://github.com/dependabot/dependabot-core/issues/16434) closed **and** ≥ 3 months of 12.x patch cadence | `packageManager` → `pnpm@12.x`; check `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` (unknown keys hard-fail), stricter transitive `engineStrict`, `--no-frozen-lockfile` spelling; lockfile becomes byte-deterministic                                                                                       |
| **TypeScript 7** (Go-native)        | typescript-eslint declares TS 7 support (7.0 ships no JavaScript API; "7.1 will ship a new API")                                           | `typescript` → 7; consider `tsc -b` parallelism only if typecheck time becomes a problem (project references are otherwise rejected — ADR 0036)                                                                                                                                                           |
| **Turborepo Boundaries → blocking** | Turborepo marks Boundaries stable                                                                                                          | drop `continue-on-error` on the CI step; keep the ESLint rules                                                                                                                                                                                                                                            |
| **`eslint-plugin-jsx-a11y` peer**   | upstream declares `eslint ^10` ([#1075](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1075))                                 | remove its `peerDependencyRules` entry                                                                                                                                                                                                                                                                    |
| **`better-auth` vitest peer**       | better-auth declares `vitest ^5`                                                                                                           | remove its `peerDependencyRules` entry                                                                                                                                                                                                                                                                    |
| **`tsconfck` TypeScript peer**      | tsconfck declares `typescript ^6`                                                                                                          | remove its `peerDependencyRules` entry                                                                                                                                                                                                                                                                    |
| **Prettier experimental CLI**       | shipped unflagged (Prettier 4)                                                                                                             | re-check `--cache` semantics; nothing else changes                                                                                                                                                                                                                                                        |

Routine minor/patch refreshes (`pnpm deps:check`, Dependabot monthly) are not tracked here.

## CI / CD

- **Turbo remote caching** — shares the task cache across CI runs and machines. **Trigger:** a
  compliance decision on Vercel Remote Cache (OIDC, no long-lived token) vs a self-hosted server
  (open API). Then set `remoteCache.signature: true` + a ≥ 32-byte
  `TURBO_REMOTE_CACHE_SIGNATURE_KEY` (see the [CI/CD guide](guides/ci-cd.md)).
- **Coverage thresholds** — coverage stays report-only until a representative baseline exists;
  gating on day one either fails CI or bakes in a meaningless bar (ADR 0025 §7). **Trigger:** the
  suite covers the auth + data paths end to end; then global thresholds, later per-package.
- **Sharded e2e** (blob reports + `merge-reports`) — **Trigger:** the e2e job exceeds ~10 minutes.
- **Deployment / Docker** — no target chosen (ADR 0013/0017). **Trigger:** the hosting decision.
  Then `output: 'standalone'` + `outputFileTracingRoot`, `turbo prune --docker`, a Dockerfile
  **with** a CI job that builds it (an unbuilt Dockerfile rots), attestations if on Enterprise.
- **Preview deployments** — per-PR previews. **Trigger:** with the deployment target.
- **Release automation** — nothing is published and `main` deploys; see the
  [release guide](guides/release.md). **Trigger:** a changelog or version is wanted → release-please
  or Changesets (`privatePackages`), recorded as an ADR.
- **Workflow lockfile for actions** (`dependencies:` block, `gh actions pin`) — on GitHub's 2026
  roadmap, not GA. **Trigger:** GA announcement.
- **Private-repo licensing** — CodeQL and dependency review are free here because the repo is
  public. **Trigger:** a derived private repo → license GitHub Code Security or delete those
  workflows (each header says so).

## Testing (ADR 0025)

- **Shared contract package** — a zod/OpenAPI contract feeding MSW handlers and provider
  assertions earns its keep once a separate backend or a second client exists (§8.3, §9).
  **Trigger:** the backend split. Full Pact only with a second client/team.
- **Real-SMTP email integration test** — Mailpit container via Testcontainers, adapter pointed
  at it, assert receipt via its API. **Trigger:** the real email transport is wired (ADR 0014).
- **OAuth end-to-end test** — needs a mock IdP (real Google login cannot be automated).
  **Trigger:** the OAuth surface grows beyond the single Google button.
- **Storybook phase 3 (Chromatic)** — **Trigger:** compliance sign-off on the SaaS; then re-add
  `@chromatic-com/storybook` and TurboSnap (ADR 0024). Phase 4 (publishing): a hosting decision;
  never GitHub Pages.
- **Stories for the promoted molecules** (`Form`, `SubmitButton`, `FormError`,
  `FormTextField`/`FormPasswordField`, `PasswordInput`, `PasswordStrength`, `Logo`) — the shadcn
  atoms have stories; the molecules do not. **Trigger:** the next change to any of them (write
  the story then; RHF-bound ones need a `useForm` wrapper).

## Repository governance (owner actions)

- Import `.github/rulesets/main.json`; enable Dependabot alerts + security updates and the
  dependency graph; squash-merge default + delete-branch-on-merge; Actions policy "require SHA
  pinning" and read-only workflow permissions (see the [CI/CD guide](guides/ci-cd.md)).
  **Trigger:** now — these are settings, not code.
- Raise required approvals 0 → 1+ and require Code-Owner review; replace the CODEOWNERS
  placeholder with teams. **Trigger:** the second maintainer.
- Required signed commits. **Trigger:** every committer (humans and bots) signs.
- Ticket linking (Linear/Jira app, `Closes PROJ-123`), `actions/labeler`. **Trigger:** a tracker
  is chosen.

## App & framework hardening

Most of the original list is **done**: security headers (ADR 0015), `poweredByHeader: false`,
root `metadata`/`viewport`/`robots`/`manifest`, jsx-a11y, `.env.example` (ADR 0013), zod form
validation, the Node/pnpm pins, typed routes, and the rendering/perf model (ADR 0019).

Remaining, **deferred with triggers**:

- **`useReportWebVitals`** — real-user Core Web Vitals. **Trigger:** an analytics sink is chosen.
- **SEO for public pages** — `opengraph-image`/`twitter-image`, JSON-LD, canonical URLs.
  **Trigger:** public/marketing pages exist (auth pages stay `noindex`).
- **`forbidden.tsx` / `unauthorized.tsx`** — custom 403/401 UI. **Trigger:** RBAC.
- **`serverExternalPackages`** — re-check `pg` / `better-auth` bundling only if a server-bundle
  issue appears (`next build` is green).
- **`instrumentation.ts` + tainting** — **Trigger:** an observability backend is chosen.
- **`experimental.turbopackRustReactCompiler`** — the Rust compiler path. **Trigger:** it leaves
  experimental.

## UI & app shell (deferred)

- **Shared error/status-page component (considered — deliberately not extracted).** The route
  boundaries (`error.tsx`, `(app)/error.tsx`, `not-found.tsx`, `global-error.tsx`) share a shape
  but were left independent on purpose: `global-error` replaces the root layout and cannot
  consume `@workspace/ui`; `not-found` + `global-error` are expected to get bespoke designs; the
  two error boundaries differ by ~6 lines. **Trigger:** a 3rd+ generic error surface with
  identical chrome, or a decision to visually lock all status pages together. Related:
  `(app)/not-found.tsx` (a 404 scoped to the app shell) — deferred while `not-found`'s design is
  expected to change.
- **Keyboard-shortcut registry + shortcuts sheet** — the three globals (⌘K palette, ⌘B sidebar,
  ⌘⇧L theme) run as separate `window.keydown` listeners. **Trigger:** a 4th+ global shortcut, or
  a ⌘/ shortcuts sheet (ADR 0023). Candidate: TanStack Hotkeys once it leaves alpha.
- **List/table virtualization** — no long lists exist yet. **Trigger:** the first scrollable
  100+ row list/table. Then TanStack Virtual (headless, MIT), lazy-loaded via `next/dynamic`.

## Auth flow (wired; later screens deferred — ADR 0011/0017)

- **Rate-limit / secondary storage** — Better Auth rate-limits by default with an in-memory store.
  **Decided:** Redis (`secondary-storage`) is the production store, wired at the deploy/scale
  trigger (ADR 0018; the 1.7 API: `increment` + `getAndDelete`).
- **Change password (Settings)** — reuse the form layer (`FormPasswordField` with `showStrength`,
  `FormError`, `submitWithFormError`, the `passwordField` schema rule); Better Auth
  `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions })`.
  **Trigger:** the settings screen. If sign-up and change-password duplicate the "new password +
  strength" block, extract then (rule of three).
- **Lightweight onboarding, OAuth callback UX** — later phases per the
  [auth-ui-ux spec](specs/auth-ui-ux-spec.md).

### Auth hardening — deploy-time follow-ups (from the 2026-08-22 audit)

- **New-device email is on the sign-in critical path.** The `databaseHooks.session.create.after`
  hook (`packages/auth/src/auth.ts`) is awaited, so on a new device it runs a query + an SMTP send
  before the sign-in response returns. Harmless with the console stub; **when a real transport is
  wired**, move the send off the response path (queue/background worker — framework `after()` is
  not reachable from the framework-neutral package).
- **Cookie/proxy hardening (deployment-dependent):** `advanced.useSecureCookies: true` in
  production; once the trusted proxy is known, `advanced.ipAddress.trustedProxyHeaders: true` with
  an `ipv6Subnet` (the leftmost `x-forwarded-for` is client-spoofable until strictly behind a
  trusted proxy). Fold into the deploy checklist with Redis (ADR 0018) and the email transport.
- **Audit logging (compliance):** durable audit events (sign-in, email change, password reset) via
  Better Auth `databaseHooks`. **Trigger:** the compliance programme defines the event set.

## Production readiness (when this backs a real product)

- Error monitoring (e.g. Sentry), analytics, structured logging. **Trigger:** the observability
  decision.
- A "Safe Harbor" clause in `SECURITY.md`. **Trigger:** the legal review before launch.
- Licence review before any public/open-source release (currently proprietary — ADR 0002).
- Agent-skill vendoring hygiene: `.agents/skills/` carries ~330 third-party files (ADR 0010).
  **Trigger:** when deriving a new product repo, prune to the skills that team uses.
