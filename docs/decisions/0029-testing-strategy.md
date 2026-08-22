# 0029. Testing strategy — Vitest + Testing Library, Playwright, real-Postgres integration, and a monorepo test architecture built for the backend split

- **Status:** Accepted (strategy + tool choices); implementation is **phased** (see
  §11) and three provisioning sub-decisions are confirmed at implementation time (§10)
- **Date:** 2026-08-22

## Context

The repo has the _seeds_ of a test setup but no strategy: **Vitest** is catalog-pinned
and runs per-package (`packages/auth` — node env, co-located `src/**/*.test.ts`, one real
test `device.test.ts`; `apps/storybook` — browser interaction tests via `addon-vitest`),
and `turbo.json` has a `test` task (`dependsOn: ["build"]`). **Missing:** any
component/DOM testing, a shared config, e2e, DB/auth integration tests, coverage, a root
`test` script, and a CI test job.

This ADR is the R&D-backed answer to the questions that were open: **which libraries (as
of 2026, not from memory), what to test and where, folder structure, how to run it in a
Turborepo, how to test the DB + Better Auth layer, and — crucially — how to design the
test architecture so it survives future scale and the planned split to a separate backend
([ADR 0027](0027-backend-architecture-fullstack-and-migration.md)).** It was researched
against official docs (Vitest 4, Testing Library, Playwright, Next.js 16, Better Auth,
Drizzle, Testcontainers, Turborepo — see §14) and the actual codebase.

**Constraints / lenses this decision is held to** (per the request — think future scope,
scalability, enterprise, monorepo, and don't assume):

1. **Enterprise-grade & scalable** — a real test pyramid that stays fast as the repo
   grows; CI that splits cleanly; coverage that matures from report-only to gated.
2. **Monorepo-native** — tests co-located with the code they cover, so they travel with a
   package when it moves or the repo splits; one shared config to evolve standards.
3. **Future-proof for the backend split** — design the seam and the harness now so
   extracting `packages/auth` + `packages/db` into a standalone service ([ADR 0027](0027-backend-architecture-fullstack-and-migration.md))
   is cheap and safe, not a test rewrite.
4. **Market-current** — the tools that are the 2026 default for this stack (Next 16 /
   React 19 / Vite / Turborepo), verified against official docs, versions pinned under the
   `minimumReleaseAge` cooldown.
5. **Repo ethos** — minimal, evidence-backed, no premature abstraction; the hard lint gate
   and existing conventions (catalogs, source-only config packages, co-location) are honored.

## Guiding principles (the bar)

- **Test the contract, not the implementation.** Assert observable behavior (the a11y
  tree, the DB, the HTTP boundary), so tests survive refactors — including the backend split.
- **Real infrastructure you own; fake services you don't.** Integration tests run against a
  real Postgres; only true ports (the `SendEmail` transport, external APIs) are mocked.
- **Fast feedback is a feature.** A cacheable unit/component layer runs on every change;
  slow, infra-bound integration/e2e run in their own lanes.
- **Tests live with their code.** Co-location makes the eventual package/repo split a no-op
  for tests.

## Decision (summary)

| Layer                     | Choice                                                                                             | Runner / env                        |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Unit** (pure logic)     | **Vitest 4** (already adopted)                                                                     | node                                |
| **Component**             | **Vitest 4 + React Testing Library v16** + `user-event` + `jest-dom`                               | **jsdom** (browser mode for layout) |
| **Integration** (DB/auth) | Vitest + **real Postgres** via **Testcontainers** (primary) / **pglite** (fallback)                | node + real pg                      |
| **E2E**                   | **Playwright Test** (`@playwright/test`, TS) in a dedicated `apps/e2e`                             | real browsers, prod build           |
| **Shared config**         | **`@workspace/vitest-config`** (source-only): `base` (node) + `dom` (jsdom) presets                | —                                   |
| **Coverage**              | **`@vitest/coverage-v8`** (already in the lockfile via Storybook), blob-merge, report-only → gated | —                                   |
| **Orchestration**         | **Turborepo** tasks split by type: `test` (cacheable) · `test:integration` · `test:e2e` (uncached) | —                                   |

**Not chosen:** Jest (not ESM/Vite-native — a parallel toolchain for no gain), Cypress
(Playwright leads on cross-browser, parallelism, trace tooling), mocking the DB for the
data layer (tests the mock, not the SQL), `happy-dom` as default (faster but less complete
than jsdom — a fidelity risk).

### FAQ: why more than one testing tool — aren't Vitest / Playwright / "jest-dom" all the same thing?

**Q — These all look like "testing libraries." Why not just pick one?**

**A — There are really only _two_ test frameworks here (Vitest + Playwright), and we do
NOT use Jest at all.** The rest are helper libraries with confusing names:

| Name                        | A test framework? | What it actually is                                                                                                             |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest**                  | ✅ yes            | The test _runner_ for unit + component + integration. Runs in Node. One tool, three layers.                                     |
| **Playwright**              | ✅ yes            | Runs **end-to-end** tests in a _real browser_.                                                                                  |
| React Testing Library       | ❌ no             | A helper to query/interact with rendered components (`getByRole`…). Plugs into Vitest.                                          |
| `@testing-library/jest-dom` | ❌ no             | Just extra assertion **matchers** (`toBeInTheDocument`). The "jest" in the name is legacy — it works with Vitest. **Not Jest.** |
| jsdom                       | ❌ no             | A **fake DOM** so component tests run in Node without a real browser. A dependency, not a tool.                                 |

**Why two frameworks and not one** — because there are two fundamentally different things
to test, and neither tool does the other's job:

- **Fast + simulated (Vitest):** Node + a fake DOM (jsdom). Tests finish in milliseconds,
  so we run thousands on every save — ideal for logic, component behavior, and DB queries.
- **Real browser + whole app (Playwright):** launches actual Chrome/Firefox/Safari and
  drives the _running_ app like a user — real navigation, cookies, redirects, cross-browser.
  The only way to prove "sign-in on Chrome truly lands on `/dashboard` with a real session."
  But each test takes seconds, so we keep them few.

Use _only_ Playwright and every trivial check boots a browser → painfully slow and flaky.
Use _only_ Vitest/jsdom and you never verify the _real_ app (jsdom has no real layout,
routing, cookies, or cross-browser). That trade-off is exactly the **test pyramid** (§5):
many fast Vitest tests at the base, a few real-browser Playwright tests at the top — not
redundancy, different jobs. (Analogy: Vitest tests car parts on a workbench; Playwright
test-drives the assembled car on a real road. You need both.)

---

## Detailed decisions, R&D & best practices

### 1. Unit + component testing

**Library — Vitest 4, confirmed.** Vite-native/ESM-first, matches the repo (`"type":
"module"`, catalog `vitest ^4.1.10`) and shares one transform pipeline with the Storybook
browser tests ADR 0018 already mandated Vite for. Add **`@testing-library/react` v16**
(React 19 support), **`@testing-library/user-event`** (`userEvent.setup()` per test), and
**`@testing-library/jest-dom`** matchers. _Already in the lockfile_ (pulled transitively by
Storybook's `addon-vitest`): `@testing-library/dom`, `jest-dom`, `user-event`,
`@vitest/browser-playwright`, `@vitest/coverage-v8`, `playwright`. _Missing and to add:_
`@testing-library/react`, `jsdom`, `@vitejs/plugin-react`.

**React Compiler caveat:** the compiler runs via `babel-plugin-react-compiler` only in
Next's build; Vitest uses its own Vite/esbuild transform, so component tests run
_un-compiled_ code. That is fine — RTL asserts observable DOM behavior, which memoization
does not change. Only add `@vitejs/plugin-react` with the compiler plugin if testing
as-shipped output is specifically needed (rare).

**DOM environment — jsdom by default.** RTL's canonical, fast, CI-cheap target. **Reserve
Vitest browser mode** (the same Playwright-chromium provider `apps/storybook` already uses)
for the few cases needing real layout/pointer/focus fidelity — and avoid duplicating what
Storybook interaction tests already cover in a real browser. Skip `happy-dom` (less
complete → inconsistency risk).

**Shared config — `@workspace/vitest-config`.** A private, source-only package (like
`@workspace/eslint-config` / `typescript-config`; exempt from ADR 0022's isomorphic/leaf
rules that bind `@workspace/utils`) exporting two presets:

```ts
// base.ts — pure logic, node
import { defineConfig } from "vitest/config";

export const base = defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

```ts
// dom.ts — components, jsdom
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";

import { base } from "./base";

export const dom = mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["@workspace/vitest-config/setup"], // imports jest-dom
      globals: true,
    },
  })
);
```

Consumers stay tiny: `packages/auth` → `base`; `@workspace/ui` + `apps/web` → `dom`. For a
single package mixing node + jsdom, use Vitest **`test.projects`** (the former `workspace`
API was removed in v4). Shared deps (`jsdom`, RTL, jest-dom, user-event) go in the
**catalog** (cross-package versions rule).

**What to test where.**

- **Unit (node):** `packages/utils`, `packages/auth` (e.g. `device.test.ts`), zod schemas,
  and the _pure_ form logic (`submitWithFormError` / error-mapping branches).
- **Component (jsdom):** `@workspace/ui` primitives + form molecules (`Form`,
  `SubmitButton`, `FormError`, `FormPasswordField`) and `apps/web` feature forms
  (`SignInForm`, …) — all presentational with injected handlers (ADR 0025), so no
  server-only module leaks in.
- **Not unit → e2e:** **async Server Components** (Next.js explicitly does not support them
  in Vitest), the real Better Auth flow, routing/PPR/streaming.
- **Co-location — keep it** (`*.test.ts(x)` beside source), matching the existing pattern;
  no `__tests__/`.

**Testing our specifics.**

- **RHF forms** are seam-friendly (handler injected): render with real `useForm`,
  `userEvent.type` + submit, assert via the a11y tree — `getByRole("alert")` for the
  `FormError` banner, `SubmitButton` disabled + label swap, focus moved to the banner.
  Inject a stub that throws `FormSubmitError("…")` and assert the verbatim message; throw a
  generic `Error` and assert the safe fallback (the ADR 0026 contract).
- **Base UI:** query portalled content via `screen` (mounts on `document.body`); drive with
  keyboard via `user-event`. jsdom has **no layout** — never assert positioning; push those
  to Storybook / browser mode.
- **`next/navigation`:** mock per-test/setup (`vi.mock("next/navigation", …)`).

**Gotchas.** jsdom applies no CSS (assert classes/roles/behavior, not computed styles);
mock `next/font`; esbuild ignores `"use client"`/`"use server"` directives (client
components import fine, server actions can't execute — test the injected handler);
`server-only` throws if a server module enters a DOM test (the ADR 0025 presentational
split prevents this); ESM is native (no transform config).

### 2. End-to-end testing

**Framework — Playwright Test (`@playwright/test`, TS).** The 2026 default for a TS/Next
stack: first-party cross-browser projects, auto-waiting web-first assertions, built-in
`storageState` auth reuse, trace viewer, sharding + blob-report merge. Next.js ships a
Playwright example. **The vendored `webapp-testing` skill (Playwright via _Python_) is a
different tool for a different job** — ad-hoc, agent-driven UI reconnaissance/debugging, not
a committed, versioned, CI-gated regression suite. Keep it for exploration; use
`@playwright/test` for the durable suite.

**Location — a dedicated `apps/e2e` workspace.** Its own `package.json` pins
`@playwright/test` + browsers, so nothing e2e enters `apps/web`'s bundle or `next build`; it
gets its own Turbo task and can exercise multiple apps later. (Co-locating in `apps/web/e2e`
couples test deps to the shipped app and muddies caching.)

**Config essentials** (`playwright.config.ts`): `webServer` runs the **production build**
(`next start`, more realistic/stable than `next dev`; `reuseExistingServer: !CI`), real env

- DB (**not** `SKIP_ENV_VALIDATION`); projects for chromium/firefox/webkit; `trace:
"on-first-retry"`, `screenshot: "only-on-failure"`, `video: "retain-on-failure"`; `retries:
2` in CI; `reporter: "blob"` in CI (merge shards) / `"html"` locally. **Design the
  `webServer` as an array from day one** (one entry now — `apps/web`; add the backend entry at
  the split, §9).

**Auth in e2e — sign in once, reuse via `storageState`.** A `setup` project (a project
dependency) drives the real sign-in form once and writes `storageState`; every browser
project loads it, so tests start authenticated with no re-login. This works with Better Auth
cookies by value (no hard-coded names; the 5-min signed `cookieCache` is captured too). One
JSON per role; `await page.waitForURL("/dashboard")` before saving so redirect-set cookies
land. Provision the test user against the **real Postgres** before the suite (e2e is
intentionally full-stack).

**Scope.** _Do:_ sign-up → verify-email banner, sign-in happy path, forgot→reset round
trip, unauthenticated `/dashboard` → redirect to `/auth`, authenticated render, sign-out.
_Don't:_ field validation / schema / component rendering / pure helpers — those are the unit
and component layers. Keep e2e a thin set of critical journeys (slow, DB-bound).

### 3. Integration testing — Better Auth + Drizzle + Postgres

**Real Postgres, not a mock.** The repositories rely on Postgres-specific behavior
(`onDelete: "cascade"`, the `email` unique index, `defaultNow()`, the `isNewDeviceSignIn`
query semantics) and Better Auth talks to the DB through its own `drizzleAdapter` — only a
real engine proves the generated schema, cascades, and adapter queries. **Mock only the true
ports:** the `SendEmail` transport (`@workspace/email` — already a console stub; inject a spy
and assert recipient/args) and future external services. This matches ADR 0019's stated
rationale for the `packages/db` boundary (testability against real Postgres).

**Provisioning — Testcontainers (primary) → pglite (fallback).**

| Option                              | Fidelity                                                                           | Speed           | CI                | Verdict                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------- | --------------- | ----------------- | -------------------------------------------------- |
| **`@testcontainers/postgresql`**    | Highest — real image, real `pg` wire/pool                                          | container start | Docker on runners | **Primary.** Prod-identical; per-run throwaway.    |
| **pglite** (`@electric-sql/pglite`) | Real PG in WASM, but single-conn, subset of extensions, _different Drizzle driver_ | sub-second      | no Docker         | **Fallback** — fastest local + Windows-friendly.   |
| docker-compose Postgres             | Real, but long-lived/shared                                                        | fast            | manual            | Dev only (already have it); risks cross-run bleed. |
| Neon branch                         | Prod-like managed PG                                                               | network-bound   | API/secrets       | Preview/e2e, not the fast integration loop.        |

Recommendation: **Testcontainers as the CI + source-of-truth**, **pglite as the fast local
fallback** (and the answer to Docker-on-Windows friction). Stay on the plain `pg` driver
(ADR 0019) so the same code runs on any of them.

**Migrations + schema.** Apply the real Drizzle migrations in global setup (`migrate(db, {
migrationsFolder })`) — never hand-craft tables. The Better Auth schema is already
materialized in `packages/db/src/schema.ts` (regenerated via the BA CLI), so migrating the
Drizzle folder suffices; assert the generated schema is committed (drift guard) rather than
running BA-generate in CI.

**Isolation.** `packages/db` repository tests → **per-test transaction rollback** (`BEGIN`/
`ROLLBACK`, fastest, perfectly isolated). `packages/auth` flow tests → **truncate between
tests** (`TRUNCATE … RESTART IDENTITY CASCADE`), because `betterAuth()` binds a fixed `db`
handle and opens its own transactions internally (rollback nesting fights it). Fresh
container per file is cleanest but slowest — reserve for suites that need it; otherwise share
one container per run.

**Testing the flows.** Drive the real instance server-side via `auth.api.*` with a `Headers`
object (BA is header-in/header-out), then assert on the DB:

```ts
// packages/auth/src/auth.integration.test.ts
it("sign-up creates a user + hashed account", async () => {
  const res = await auth.api.signUpEmail({
    body: { email: "ada@example.com", name: "Ada", password: "correcthorse1" },
    returnHeaders: true,
  });
  const [acct] = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, res.response.user.id));
  expect(acct.password).toBeTruthy(); // hashed, not plaintext
});
```

Cover sign-in, password reset (assert `revokeSessionsOnPasswordReset` cleared other
sessions), the `account-exists` plugin (`{ exists }` + its 10/min limit), and the new-device
hook (seed a first session → hook must not fire; sign in with a new UA → assert the **mocked**
`sendNewDeviceEmail` fired once). Seed users through `auth.api.signUpEmail` (real hashing),
not raw inserts. **Version flag:** Better Auth ships a `testUtils()` plugin (session
factories, OTP capture) in **≥1.7**; the repo is on **1.6.26**, so use `auth.api.*` today and
bump opportunistically (keep `testUtils` in a test-only auth factory, never prod config).

**Location.** `*.integration.test.ts` beside the code, in `packages/db` and `packages/auth`;
run via a **separate `test:integration`** project/script (container + migrate global-setup),
excluded from the default fast `test` include.

### 4. Monorepo orchestration, coverage & CI

**Turborepo tasks — split by type** (different cache semantics):

```jsonc
"test":             { "dependsOn": ["^build"], "outputs": ["coverage/**"] },  // unit — cacheable
"test:integration": { "dependsOn": ["^build"], "cache": false, "env": ["DATABASE_URL"] },
"test:e2e":         { "dependsOn": ["build"],  "cache": false }               // needs the app build
```

Add a root `"test": "turbo run test"`. Change the current `dependsOn: ["build"]` →
`["^build"]` so unit tests of `packages/auth` don't wait on `apps/web`'s `.next`. Unit stays
**cacheable**; integration/e2e stay **uncached** (they depend on live Postgres/servers Turbo
can't fingerprint). `globalPassThroughEnv` already forwards `DATABASE_URL` / `BETTER_AUTH_*`.

**Coverage — `@vitest/coverage-v8`** (already the repo's provider via Storybook). Merge
across packages with the blob pattern (`reporters: ["default", "blob"]` → a `report` task
running `vitest --merge-reports`). **Report-only first** (per `future-improvements.md`), then
flip on `thresholds` (global → per-package/glob) once a baseline exists. Reports in
`coverage/` (git-ignored).

**CI.** Keep the existing single fast gate (format/lint/typecheck/build) and add a **parallel
`test` job** (unit + coverage) — cheapest at current size. Integration + e2e are **separate
jobs** (they need services the fast job shouldn't carry): integration with a `postgres:17`
service (or Testcontainers) + migrations; e2e with `playwright install --with-deps` +
sharding + artifact upload (traces/videos). Turn on `TURBO_TOKEN`/`TURBO_TEAM` (already
stubbed) so cache spans runs. Split the fast gate into per-check jobs only when repo size
warrants (already noted in `future-improvements.md`).

---

## 5. The test pyramid (what to test, where, and why)

| Level           | Runs on      | Home                                     | Cacheable | Covers                                                 |
| --------------- | ------------ | ---------------------------------------- | --------- | ------------------------------------------------------ |
| **Unit**        | every change | each package, co-located `*.test.ts`     | ✅        | pure logic, zod, helpers, device parsing               |
| **Component**   | every change | `@workspace/ui`, `apps/web` `*.test.tsx` | ✅        | primitives, RHF forms, a11y tree, pending/error states |
| **Integration** | its own lane | `packages/db`, `packages/auth`           | ❌        | repositories, Drizzle SQL, Better Auth flows, hooks    |
| **E2E**         | PR / nightly | `apps/e2e`                               | ❌        | critical user journeys, auth end-to-end, redirects     |

Many fast tests at the bottom, few slow ones at the top — the shape that keeps CI fast as
the codebase grows. **The enforcing property is _location_:** because units live in their
package and integration lives with `db`/`auth`, they travel automatically when a package
moves or the repo splits (§9).

## 6. Target folder structure

```
packages/
  vitest-config/               # NEW — @workspace/vitest-config (base=node, dom=jsdom, setup)
  utils/  auth/  db/           # *.test.ts (unit) + *.integration.test.ts (real pg)
  ui/src/components/**/         # *.test.tsx (component, jsdom)
apps/
  web/  components|lib/**/*.test.tsx   # feature-component + seam tests (MSW, §9)
  e2e/                          # NEW dedicated workspace
    playwright.config.ts        # webServer as an ARRAY (one entry now)
    tests/…  setup/auth.setup.ts  .auth/ (gitignored)
```

## 7. Enterprise scale — the maturity path (do NOT do it all at once)

- **CI:** single gate → parallel jobs (lint/typecheck/build · unit+coverage · integration ·
  e2e) → sharding → Turbo remote cache. Split only when size warrants.
- **Coverage:** report-only → global thresholds → per-package/glob gates. Never gate on day
  one (noise, false confidence).
- **Speed/isolation at scale:** transaction-rollback for repo tests, truncate for auth flows,
  one container per CI job; unit stays cacheable so most changes get sub-minute feedback.

---

## 8. Open decisions (confirm at implementation)

1. **Integration DB provisioning:** Testcontainers (highest fidelity; needs Docker/WSL2 on
   the Windows dev box) **vs** pglite (in-process, Windows-friendly; different driver + PG
   feature subset). → **Rec:** Testcontainers as CI source-of-truth, pglite as fast local
   fallback.
2. **Better Auth `testUtils()`** (session factories/OTP) lands in **≥1.7**; repo is on
   **1.6.26**. → **Rec:** use `auth.api.*` now; bump opportunistically.
3. **Shared contract package** (§9) now vs at-split. → **Rec:** a lightweight zod contract
   now — cheap insurance that de-risks the split.

## 9. The separate-backend scenario ([ADR 0027](0027-backend-architecture-fullstack-and-migration.md))

If `packages/auth` + `packages/db` (+ an API) later become a standalone service (Node/Hono/
Express), the testing strategy adapts as follows — and a few **design-now** moves make that
split cheap rather than a rewrite:

| Aspect                 | At the split                                                                                | Design-now move                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit / integration** | Integration tests travel **with** `auth`+`db` into `apps/api`; units already in-package     | Keep integration **inside the packages**, never in `apps/web`                                                                                                       |
| **The seam**           | `authClient` is _already_ an HTTP client; only `lib/auth-client.ts`'s `baseURL` moves       | **Test the seam with MSW** (intercept `/api/auth/*`) — never mock `authClient` internals, so tests survive unchanged                                                |
| **Contract**           | Two services can drift                                                                      | A **shared zod/OpenAPI contract package** feeding _both_ MSW handlers and provider assertions — one source of truth (full Pact only when a 2nd client/team appears) |
| **E2E**                | Playwright boots **both** services                                                          | Build the `webServer` as an **array** from day one; seed via the backend                                                                                            |
| **`lib/session.ts`**   | Becomes an HTTP/DB-less session read (ADR 0027 §4) — the one file with real logic to change | —                                                                                                                                                                   |

**Reusable vs rebuilt:** reusable — the whole Vitest/coverage/shared-config harness, MSW
setup, the Playwright rig, the Postgres CI service, every package-local test. Rebuilt —
`lib/session.ts` + its tests, plus CORS/cross-origin-cookie e2e cases that don't exist in
fullstack. **CI/ownership:** two deploy units → two pipelines (web: build+unit+component;
api: build+integration) + a shared e2e job booting both; tests live with the code, so the
repo/team split needs no test migration.

## 10. Phased roadmap

1. **Foundation** — `@workspace/vitest-config`; component testing wired (`@workspace/ui` +
   `apps/web` forms); root `test` script; Turbo `test` (cacheable) + coverage **report-only**;
   **CI unit job**.
2. **Integration** — `packages/db` repos + `packages/auth` flows against Testcontainers/
   pglite; `test:integration` task; CI integration job.
3. **E2E** — `apps/e2e` (Playwright, `storageState`, `webServer` array); CI e2e job (sharded).
4. **Hardening for the split** — shared **contract package** + **MSW** seam tests; flip on
   coverage **thresholds**.

## 11. Implementation Q&A & decision log

Questions raised while implementing this strategy, with the answers and decisions, so the
_why_ is preserved (dates are when the decision was taken).

### Q1 — Aren't Vitest, Playwright, "jest-dom", jsdom all "testing libraries"? Why not one? (2026-08-22)

**Decided.** There are only two _frameworks_ — **Vitest** (unit + component + integration,
in Node) and **Playwright** (e2e, real browser); we do **not** use Jest. RTL / jest-dom /
jsdom are helper libraries, not frameworks. Two frameworks because fast-simulated and
real-browser are different jobs (the test pyramid). Full reasoning + table in the **FAQ**
under "Decision (summary)" above.

### Q2 — How should integration tests provision Postgres? Every option, every aspect. (2026-08-22)

**Decided: Testcontainers** as the primary integration-test DB (local + CI); **Neon
branch-per-PR** complementary later for preview/e2e/migration rehearsal (Phase 3+);
**pglite** an optional no-Docker fallback. Rationale: it's the de-facto enterprise standard
for testing the data layer, and it's **prod-identical** — real `postgres:17` over our actual
`node-postgres` driver (ADR 0019), ephemeral and isolated, and it scales unchanged into any
cloud/devops pipeline. For a compliance-bound product, fidelity wins for the layer whose job
is "does our SQL/auth actually work against real Postgres." (`node-postgres` = our prod
driver, self-hosted Postgres with Neon a reversible option — ADR 0019.)

| Option                                       | Fidelity (vs prod)         | Speed (inner loop)     | Isolation               | Local / Windows     | CI                        | Cloud/devops fit           | Cost                 | Driver parity\*                              |
| -------------------------------------------- | -------------------------- | ---------------------- | ----------------------- | ------------------- | ------------------------- | -------------------------- | -------------------- | -------------------------------------------- |
| **Testcontainers** (throwaway `postgres:17`) | ★★★★★ real PG, real wire   | ★★★★ (container reuse) | ★★★★★ per-run/per-file  | needs Docker daemon | ★★★★★ runners have Docker | ★★★★★ maps to any pipeline | free                 | ✅ `node-postgres` (prod driver)             |
| **pglite** (WASM, in-process)                | ★★★ real engine, no server | ★★★★★ sub-second       | ★★★★★ fresh instance    | ★★★★★ zero infra    | ★★★★★ no service          | ★★★                        | free                 | ❌ `drizzle-orm/pglite` (not prod)           |
| **CI `services:` Postgres**                  | ★★★★★ real PG              | ★★★★                   | ★★★ one shared DB/job   | ✗ CI-only           | ★★★★                      | ★★★★                       | free                 | ✅ node-postgres                             |
| **docker-compose (shared local)**            | ★★★★★ real PG              | ★★★                    | ★★ shared, manual reset | needs Docker        | ✗ awkward                 | ★★★                        | free                 | ✅ node-postgres                             |
| **Neon branch (cloud, per-run)**             | ★★★★★ real managed PG      | ★★ network latency     | ★★★★★ branch per PR/run | ✗ needs net + token | ★★★★ needs secrets        | ★★★★★ _is_ the cloud       | $ per branch/compute | ⚠️ node-postgres TCP ✅ / serverless HTTP ❌ |

\* Prod is self-hosted Postgres via **node-postgres** (`pg`) + Drizzle (ADR 0019); Neon is a
reversible dev/preview option. **What enterprises do (2026):** Testcontainers is the
mainstream standard for DB-layer integration tests; cloud branching (Neon/Supabase) is the
_preview/e2e_ tool, not the fast inner loop; `services:` is the older CI-only pattern;
pglite is great DX but not yet the full-fidelity default.

### Q3 — Isn't integration-testing the DB over-engineering _right now_? (2026-08-22)

**Recommendation (awaiting confirmation): defer Phase 2** until real _domain_ data logic
exists. Today the bespoke,
only-a-real-DB-can-verify surface is tiny — `isNewDeviceSignIn` (one branching query) and the
`account-exists` plugin; everything else is either **Better Auth** (a tested library — testing
it tests their code) or trivial (`getUserById` = a one-line select). Standing up the full
Testcontainers harness (containers, migrations, isolation, a CI Postgres lane, maintenance)
to guard two thin functions is a poor value/effort ratio; the harness cost is fixed
regardless of test count. **Trigger to revisit:** the first real domain repository — billing
ledgers (multi-row ACID), RBAC/permission queries, multi-tenant isolation, custom joins —
exactly what the `packages/db` boundary was built for (ADR 0019). Phase 1 (unit + component)
already covers where the bespoke logic actually lives today. This keeps the repo's
"minimal, no premature abstraction" ethos. The provisioning verdict in Q2 stands as the
_ready_ plan for when the trigger fires.

## Consequences

**Positive:** a real, fast test pyramid; high-fidelity data/auth tests (real Postgres);
enterprise-ready CI that splits cleanly; a harness and seam design that make the ADR 0027
backend split cheap; standards centralized in one config package.

**Negative / costs:** integration + e2e need infrastructure (Docker/Postgres, Playwright
browsers) → slower, uncached lanes and more CI wiring; Testcontainers wants Docker (Windows
friction — mitigated by pglite); more moving parts (a new config package, an `apps/e2e`
workspace) to maintain.

**Neutral:** implementation is deferred/phased (this ADR records the direction, like
[0028](0028-rate-limiting-and-secondary-storage.md)); the three §8 sub-decisions are
confirmed when Phase 1/2 land.

## Version notes & uncertainties (verify at implementation, per AGENTS.md)

- **Vitest 4.x** — `test.projects` replaces the removed `workspace` API; blob /
  `--merge-reports` stable since v3.
- **RTL v16 + React 19** — verify `act` interplay when first wiring component tests.
- **Playwright ~1.61–1.62** — pin the exact catalog version under `minimumReleaseAge`; Next
  16's `@next/playwright` "testmode" (network interception) is optional/newer — adopt only if
  needed.
- **Better Auth `testUtils()`** — **≥1.7** (repo on 1.6.26); use `auth.api.*` until a bump.
- **Next.js 16** — async Server Components are **not** unit-testable (→ e2e).
- **Turborepo 2.10** — `transit`/`merge-reports` wiring are recent 2.x features; verify
  against the installed version.
- **pglite** — different Drizzle driver + PG-extension subset than prod `pg`; not a full
  substitute for Testcontainers fidelity.

## Sources

- **Vitest:** [config](https://vitest.dev/config/) ·
  [projects](https://vitest.dev/guide/projects) (replaces `workspace`) ·
  [environment](https://vitest.dev/guide/environment) ·
  [browser mode](https://vitest.dev/guide/browser/) ·
  [coverage](https://vitest.dev/guide/coverage)
- **Testing Library:** [React](https://testing-library.com/docs/react-testing-library/intro) ·
  [user-event](https://testing-library.com/docs/user-event/intro) ·
  [jest-dom](https://github.com/testing-library/jest-dom)
- **Next.js:** [Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
  (async-RSC limitation) · [Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)
- **Playwright:** [auth / storageState](https://playwright.dev/docs/auth) ·
  [webServer](https://playwright.dev/docs/test-webserver) ·
  [sharding](https://playwright.dev/docs/test-sharding) ·
  [CI](https://playwright.dev/docs/ci-intro)
- **Better Auth:** [server API](https://www.better-auth.com/docs/concepts/api) ·
  [testUtils plugin](https://www.better-auth.com/docs/plugins/test-utils) _(≥1.7 — verify)_
- **Drizzle:** [migrations](https://orm.drizzle.team/docs/migrations) ·
  [pglite driver](https://orm.drizzle.team/docs/get-started-pglite)
- **Testcontainers:** [PostgreSQL module (Node)](https://node.testcontainers.org/modules/postgresql/)
- **pglite:** [pglite.dev](https://pglite.dev)
- **Turborepo:** [Vitest guide](https://turborepo.dev/docs/guides/tools/vitest) ·
  [task config / caching](https://turborepo.dev/docs/reference/configuration)
- **Repo evidence:** `packages/auth/vitest.config.ts` + `device.test.ts`,
  `apps/storybook/vitest.config.ts`, `pnpm-workspace.yaml` (catalog), `turbo.json`,
  `.github/workflows/ci.yml`, `docker-compose.yml`, `apps/web/lib/{auth,session}.ts`.

## Relationship to other ADRs

Builds on [0018](0018-storybook-and-visual-testing.md) (Vite/Storybook browser tests),
[0019](0019-data-layer-postgres-drizzle.md) (Postgres/Drizzle boundary — the integration
target), [0020](0020-email-transactional-messaging.md) (the `SendEmail` port we mock),
[0022](0022-shared-code-and-utilities-organization.md) (per-package co-location + config
packages), [0025](0025-frontend-architecture-forms-data-state-routing.md) /
[0026](0026-form-submission-and-pending-state-pattern.md) (the presentational forms + pending
contract we assert), and [0027](0027-backend-architecture-fullstack-and-migration.md) (the
backend split this architecture is designed to survive). Supersedes the ad-hoc testing notes
in [../future-improvements.md](../future-improvements.md), which now points here.
