# 0033. Toolchain version policy & the 2026-10 modernization (pnpm 11, Node pin, TS 6, ESLint 10, Vitest 5)

- **Status:** Accepted (supersedes [0006](0006-defer-typescript-7-and-eslint-10.md); amends [0005](0005-lint-gate-and-vendored-exception.md))
- **Date:** 2026-10-07

## Context

The [2026-10 foundation audit](../audits/2026-10-07-foundation-audit-and-plan.md) found the
toolchain a generation behind the ecosystem, and two tools past end-of-life:

| Tool       | Repo had                                    | Ecosystem on 2026-10-07                                                               |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| pnpm       | 10.34.5                                     | 11 GA (2026-04-28, security defaults on), 12 GA (2026-08-26, Rust rewrite)            |
| Node       | 24.13.0 locally; `.nvmrc` = `24` (floating) | 24 → Maintenance 2026-10-20; 26 → Active LTS 2026-10-28                               |
| TypeScript | 5.9.3                                       | 6.0 (2026-03-23, the official bridge release), 7.0 (2026-07-08, Go-native, no JS API) |
| ESLint     | 9.39.5                                      | **9 EOL since 2026-08-06, npm-deprecated**; 10.12                                     |
| Vitest     | 4.1.11                                      | 5.0.3; the documented blocker (`@storybook/addon-vitest` peers) is lifted in 10.6.1   |

[0006](0006-defer-typescript-7-and-eslint-10.md) deferred TS 7 / ESLint 10 "until the ecosystem
is ready". Its triggers have fired or changed shape: typescript-eslint supports TS `< 6.1` and
ESLint 10; the official `create-turbo` template is on ESLint 10 (it dropped `eslint-plugin-react`
rather than wait); ESLint 9 staying is now a compliance finding, not caution.

The audit also found the repo **uninstallable on the maintainer's machine**: a Dependabot bump to
jsdom 30 (engines `^24.15`) was merged while Node 24.13 was installed and `.nvmrc` = `24` let CI
float to a newer patch. The Node version was not actually pinned anywhere.

## Decision

### 1. Version policy (the durable part)

1. **Pin exactly what reproducibility depends on**: the package manager (`packageManager`), the
   Node runtime (`.nvmrc` exact + `devEngines.runtime`, resolved into the lockfile by pnpm so CI
   and every dev box run the same binary), and GitHub Actions (full SHA). Range only what semver
   can be trusted for (library deps in the catalog).
2. **Every deferred upgrade carries a dated or testable trigger** in `docs/future-improvements.md`
   — never "later". Current triggers: Node 26 (2026-10-28 LTS), pnpm 12 (Dependabot
   security-update support, 3 months of patches), TypeScript 7 (typescript-eslint support).
3. **EOL is a hard trigger.** A tool past its published end-of-life is upgraded in the next
   foundation change, whatever the plugin ecosystem says; blockers are replaced, not waited for.
4. **Verify, never blind-merge** (unchanged from AGENTS.md): read the changelog, run the full
   gate, write an ADR for a major that changes how we work. Dependabot majors are ungrouped for
   exactly this reason.

### 2. The 2026-10 moves

- **pnpm 11.28.x** (not 12): 11 is five months mature with full Dependabot support and turns on
  the security defaults we had hand-set (`minimumReleaseAge`, `strictDepBuilds`,
  `blockExoticSubdeps`, `verifyDepsBeforeRun`). 12 is a six-week-old rewrite whose Dependabot
  security-update support has an open issue; the config migration is identical, so 12 is cheap
  later. pnpm 11 reads only auth/registry settings from `.npmrc`, so all settings live in
  `pnpm-workspace.yaml`, written explicitly as the repo's supply-chain posture. pnpm
  self-manages its pinned version (Corepack is not needed and Node ≥ 25 no longer ships it).
- **Node 24.21.0 pinned** via `.nvmrc` (exact) and `devEngines.runtime` with
  `runtimeOnFail: download` (pnpm downloads it and runs every script with it). `engines.node`
  is `>=24.15.0 <25`. Consequence: pnpm normalises the manifest to `onFail: download`, a value
  npm does not understand — inside the repo use `pnpm` and `pnpm dlx`, never npm/npx (the repo
  is pnpm-only anyway).
- **TypeScript 6.0.3**, the official bridge to 7.0 ("code that compiles under 6.0 compiles
  identically under 7.0"). Presets follow the TS module guidance: explicit `target`/`lib`
  (es2024; DOM only in the React/Next presets), explicit `types` (6.0 no longer auto-includes
  `@types`), `verbatimModuleSyntax` (deterministic import elision for every single-file
  transpiler — Turbopack, Vite, Node type-stripping), `erasableSyntaxOnly`,
  `noImplicitOverride`; `declaration*` dropped (nothing emits). TS 7 waits for typescript-eslint
  (7.0 ships no JavaScript API).
- **ESLint 10.12** with `defineConfig`/`globalIgnores`, `eslint-config-prettier/flat` LAST in
  every leaf config, and type-aware rules (`recommendedTypeChecked`, `projectService`) because
  unawaited promises and misused async handlers are the bugs that matter in an auth + database
  codebase. `eslint-plugin-react` (no ESLint 10 support, runtime failure, issue open since
  February) is replaced by `@eslint-react/eslint-plugin`; `eslint-plugin-only-warn` is removed —
  with `--max-warnings 0` the CI outcome is identical, but it erased the error/warning
  distinction in editors and made `"error"` in our configs a lie (amends 0005). The vendored
  shadcn tree relaxes React-19-idiom and `any`-typing rules only; our own code is fixed.
- **Vitest 5.0.3** in lockstep with `@vitest/coverage-v8` and `@vitest/browser-playwright`
  (companions peer-pin the exact version), Storybook 10.6.1, turbo 2.11, Prettier 3.9.9,
  Testcontainers 12.2. Next.js 16.4 + React 19.3 followed on 2026-10-08 once the 24h
  release-age gate allowed it (in lockstep: react, react-dom, their types, next and its ESLint
  plugin; `partialPrefetching: true` added per the 16.4 post).

## Consequences

- **Positive:** reproducible toolchain (same Node/pnpm everywhere), EOL exposure closed, the
  install works on a fresh machine with nothing but pnpm, type-aware lint catches a class of
  async bugs, and every future upgrade has a written trigger.
- **Negative / accepted:** `npx` from inside the repo fails on a mismatched system Node (by
  design — use `pnpm dlx`); `@eslint-react` and `pnpm/setup@v3` are newer than what they replace;
  jsx-a11y runs on ESLint 10 ahead of its declared peer range (`peerDependencyRules` documents
  it with a removal trigger).
- **Dependabot:** majors for TypeScript (7), `@types/node` and `jsdom` stay ignored with named
  triggers; everything else flows monthly once version updates are switched on (template
  switch, [0037](0037-git-hooks-commit-governance-and-pr-gates.md) §6) — until then the catalog
  is refreshed by hand with `pnpm deps:check`.

## Revisit triggers

- 2026-10-28: Node 26 becomes Active LTS → bump `.nvmrc`, `devEngines.runtime`, `engines`,
  `@types/node`, verify Next/Playwright/Testcontainers.
- typescript-eslint declares TypeScript 7 support → TS 7 (and `tsc -b` parallelism if ever
  needed).
- dependabot-core pnpm-12 security updates fixed + ≥ 3 months of patch cadence → pnpm 12.
- `eslint-plugin-jsx-a11y` declares ESLint 10 → drop its `peerDependencyRules` entry.

## References

- pnpm: <https://pnpm.io/blog/releases/11.0>, <https://pnpm.io/supply-chain-security>,
  <https://pnpm.io/package_json> (`devEngines`), <https://pnpm.io/settings>
- Node release schedule: <https://github.com/nodejs/Release>; Corepack removal:
  <https://github.com/nodejs/corepack#readme>
- TypeScript 6.0 / 7.0 announcements: <https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/>,
  <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>; module options guide:
  <https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html>
- ESLint version support & migration: <https://eslint.org/version-support/>,
  <https://eslint.org/docs/latest/use/migrate-to-10.0.0>; typescript-eslint typed linting:
  <https://typescript-eslint.io/getting-started/typed-linting>; `eslint-plugin-react` ESLint 10
  issue: <https://github.com/jsx-eslint/eslint-plugin-react/issues/3977>
- Vitest 5 migration: <https://vitest.dev/guide/migration>
