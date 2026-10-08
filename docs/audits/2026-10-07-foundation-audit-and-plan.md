# Foundation audit & modernization plan — 2026-10-07

**Status:** EXECUTED on 2026-10-07 (branch `chore/foundation-2026-10`; ADRs 0033–0038 record the
decisions, `docs/guides/` the resulting workflows). Deviations from the plan as written: no
editor-specific directory was committed (editor-agnostic by request); the CI audit gate uses
`--audit-level=high` with explicit `auditConfig.ignoreGhsas` entries instead of
`--ignore-unfixable`, which turned out to be a silent write mode that exits 0; Next.js 16.4 +
React 19.3 wait for the release-age gate (trigger recorded); and an in-range dependency refresh
was included to clear a critical Next.js advisory the audit surfaced. Everything else below was
implemented as described.

**Scope:** the monorepo _foundation_ only — package manager, workspace, task graph, TypeScript,
lint/format, testing architecture, CI/CD, security & supply chain, env management, git hygiene,
documentation. Application code (auth flows, UI components, routes) is out of scope except where a
foundation change touches it.

**Method:** every file in the tree was inspected (668 tracked files; 72 vendored shadcn files and
~330 vendored agent-skill files treated as opaque). Every recommendation below was checked against
the **current official documentation** on 2026-10-07 (links in §12). Where a finding contradicts an
existing ADR, the ADR is named and the evidence given — nothing is re-litigated without evidence.

---

## 1. Executive summary

**What is already good (keep).** The repo is far better than a typical starter: ADR discipline
(32 records), a validated env contract with a lint choke-point, source-only internal packages with
`exports` maps and lint-enforced boundaries, a three-tier test strategy with real Postgres, a
dedicated e2e workspace, SHA-pinned least-privilege CI, catalog-managed shared versions, a
`minimumReleaseAge` supply-chain cooldown, and Prettier as the single formatter.

**What is wrong (must change).** The foundation has drifted from its own rules and from the
ecosystem, and three of the problems are _correctness_ bugs, not taste:

1. **The repo does not install on this machine.** A Dependabot bump to jsdom 30 (engines
   `^24.15.0`) was merged while the repo's own notes said to hold it at 26 until Node ≥ 24.15. The
   dev box runs Node 24.13.0, there is no `node_modules`, and `pnpm install` fails under
   `engine-strict`. CI passes only because `.nvmrc` = `24` floats to the newest 24.x. The Node
   version is not actually pinned anywhere.
2. **Turborepo caches stale test results.** The `test` task has no `dependsOn`, so in this
   source-only ("just-in-time") setup a change in `packages/ui` does not invalidate `web#test`.
   Turborepo's TypeScript guide documents the fix (a transit node).
3. **A build-time variable is excluded from the build hash.** `BETTER_AUTH_URL` feeds
   `metadataBase` in the root layout (prerendered under Cache Components) but sits in
   `globalPassThroughEnv`, which by definition does not contribute to the cache key.
4. **Every major tool is one or two majors behind, and two of them are end-of-life.** ESLint 9 is
   EOL (2026-08-06) and npm-deprecated; pnpm 10 is two majors behind (11 in April, 12 in August
   2026); TypeScript 6.0 (March) and 7.0 (July) shipped; Vitest 5 shipped and its documented blocker
   (Storybook's addon) is resolved; Node 24 enters Maintenance on 2026-10-20 and Node 26 becomes
   Active LTS on 2026-10-28. ADR 0006's "wait for the ecosystem" triggers have fired.
5. **Package boundaries leak through `paths`.** Every package declares a `paths` self-alias that
   bypasses its own `exports` map, and `apps/web` aliases `@workspace/ui/*` straight into
   `packages/ui/src`. Both TypeScript and Turborepo docs say not to do this.
6. **Dead and stale configuration**: a legacy `.eslintrc.js` ESLint 9/10 cannot read, a
   `tsconfig.lint.json` pointing at a non-existent folder, `transpilePackages` that Turbopack makes
   redundant, a CODEOWNERS entry for `apps/docs`, an unused `@turbo/gen` dependency, and a dozen
   stale statements across README/ADRs/comments.
7. **Governance gaps that matter for a template**: no ruleset on `main`, Dependabot alerts
   appear disabled (API returns 404), Storybook sits outside the lint/typecheck/CI gate, no git
   hooks, no dead-code/unused-dependency check, and CI repeats its setup four times with no
   affected-package filtering.

**What will change (the plan).** Five ordered phases (§8): fix the broken install and pin
versions → modernize the toolchain (pnpm 11, Node pin, TS 6, ESLint 10, Vitest 5, Next 16.4) →
correct the task graph, boundaries and config hygiene → harden CI/governance and add the missing
guards (knip, hooks, PR-title check, issue templates, rulesets, composite setup action) → fix the
docs and write the ADRs. Every phase ends with the full gate green and one or more Conventional
Commits on a branch.

---

## 2. What was inspected

| Area            | Files                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace / PM  | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `.nvmrc`, `taze.config.mjs`                                                 |
| Task graph      | `turbo.json`, every workspace `package.json` script                                                                                            |
| TypeScript      | `packages/typescript-config/*.json`, all 12 `tsconfig*.json`                                                                                   |
| Lint / format   | `packages/eslint-config/*.js`, all 9 `eslint.config.js`, `.eslintrc.js`, `.prettierrc`, `.prettierignore`, `.editorconfig`                     |
| Tests           | `packages/vitest-config/*`, all `vitest*.config.ts`, `apps/e2e/*`, `packages/db/test/*`, `apps/storybook/*`                                    |
| CI / governance | `.github/workflows/*.yml`, `dependabot.yml`, `CODEOWNERS`, PR template, GitHub repo settings via `gh`                                          |
| Env             | `packages/env/src/index.ts`, `apps/web/.env.example`, `packages/db/drizzle.config.ts`, `next.config.ts`                                        |
| Git             | `.gitignore`, `.gitattributes`, history style (Conventional Commits in use), lingering Dependabot branches                                     |
| Docs            | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, `AGENTS.md`, all 32 ADRs, `future-improvements.md`, `references.md`, package READMEs |

Live facts gathered: Node 24.13.0, pnpm 10.34.5, no version manager, no `node_modules`, repo is
**public** on GitHub (source-available, proprietary licence), no rulesets, Dependabot alerts not
enabled, nine stale `dependabot/*` remote branches.

---

## 3. Findings by area (classified)

Legend: **KEEP** already right · **CHANGE** works but must improve · **REMOVE** dead/harmful ·
**ADD** missing and valuable · **OPTIONAL** depends on team/product. Each non-trivial item
states _problem → why here → trade-off → official stance → verdict_.

### 3.1 Package manager & dependency architecture

| #   | Item                                                                      | Verdict           | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | pnpm pinned via `packageManager`, `engine-strict`                         | KEEP (relocate)   | Correct mechanism. pnpm 11+ reads only auth/registry from `.npmrc`; `engineStrict: true` moves to `pnpm-workspace.yaml`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D2  | pnpm **10.34.5**                                                          | CHANGE → **11.x** | 10 has no support policy and is two majors behind. 11 (Apr 2026) turns on the security defaults we hand-set (`minimumReleaseAge`, `strictDepBuilds`, `blockExoticSubdeps`, `verifyDepsBeforeRun`), is pure ESM on Node 22+, and has full Dependabot support. **Not 12 yet**: 12 is a six-week-old Rust rewrite; Dependabot pnpm-12 support landed 2026-09-21 with an open security-update issue (#16434); unknown workspace keys hard-fail. The config migration is identical, so 12 is cheap later. Trigger for 12: #16434 closed + three months of patch cadence. The documented Windows Corepack blocker is moot — pnpm self-downloads the pinned version (`managePackageManagerVersions`, default on). |
| D3  | Node version                                                              | CHANGE            | Pin exactly: `.nvmrc` → `24.21.0` (latest 24.x), `engines.node` → `>=24.15.0 <25`, add `devEngines.runtime` (`node 24.21.0`, `onFail: download`) so pnpm resolves the runtime into the lockfile and CI/local run the same binary. Dated trigger: **2026-10-28 Node 26 Active LTS** → bump `.nvmrc`/engines/`@types/node` after Next/pnpm/Playwright/Testcontainers compat check. Node 24 goes Maintenance 2026-10-20.                                                                                                                                                                                                                                                                                      |
| D4  | Default catalog for shared deps                                           | KEEP + CHANGE     | Catalog is the right tool. Add `catalogMode: strict` and move **all** third-party deps into it (single-version policy): one bump site, no silent duplicate majors across packages, Dependabot/taze/knip all operate on one file. Trade-off: ~40 entries move from manifests to the catalog; `pnpm add` must target the catalog. pnpm docs list "maintain unique versions" as the catalog's first purpose.                                                                                                                                                                                                                                                                                                  |
| D5  | `allowBuilds` object                                                      | KEEP              | Correct 10.26+/11 form. Add `strictDepBuilds: true` now (11 default).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D6  | `minimumReleaseAge: 1440`                                                 | KEEP              | Matches 11 default; 11 auto-enables `minimumReleaseAgeStrict` when set explicitly — acceptable, we want hard failure not silent fallback. Drop the "remove after pnpm 11" comment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| D7  | Supply-chain knobs                                                        | ADD               | `blockExoticSubdeps: true`, `trustPolicy: no-downgrade`, `verifyDepsBeforeRun: install` — the exact list on pnpm's supply-chain page; near-zero cost.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D8  | `overrides` with `pkg@<range` selectors                                   | KEEP              | Documented syntax; keep the GHSA comments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| D9  | `pnpm dedupe --check`                                                     | ADD (CI)          | Cheap guard against lockfile bloat; currently 40+ packages have 2–3 versions, mostly transitive and unavoidable, but `zod` 3/4 duplication is worth watching.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| D10 | `workspace:*` protocol                                                    | KEEP              | Correct; pnpm defaults (`linkWorkspacePackages: false`, isolated linker, no public hoist) are right — do not set `shamefullyHoist`/`publicHoistPattern`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D11 | Root devDeps `@workspace/eslint-config`, `@workspace/typescript-config`   | REMOVE            | Nothing at the root lints or typechecks with them (root tsconfig goes away, see T6). Turborepo: root holds repo-management tools only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| D12 | `@turbo/gen` in `packages/ui`                                             | CHANGE            | No generators exist → dead dep. Move to the root with a real `turbo/generators/` package scaffold (see G5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D13 | `@chromatic-com/storybook`                                                | REMOVE            | Installed and registered as an addon but no Chromatic project exists (ADR 0024 phase 3 deferred). Re-add at the phase-3 trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| D14 | Dependabot: npm `quarterly`, grouped minor/patch, cooldown, major ignores | CHANGE            | `quarterly` leaves version drift for months; with cooldown GA (3-day default since 2026-07) **monthly** grouped is the better posture. Keep major ignores only for things still deferred (TS 7, pnpm 12, Node 26 until adopted). Enable **Dependabot alerts + security updates** (repo setting; currently off). Align `cooldown.default-days` with `minimumReleaseAge` (dependabot-core honours the larger).                                                                                                                                                                                                                                                                                               |
| D15 | `pnpm audit --prod` report-only                                           | CHANGE            | Make it blocking at `--audit-level=high --ignore-unfixable`: a _fixable_ high/critical advisory must force a decision (override or bump) in a compliance-bound repo; unfixable ones stay informational. GitHub's own PR gate is `dependency-review-action` (free on public repos; needs Code Security on private) — add it too (C7).                                                                                                                                                                                                                                                                                                                                                                       |
| D16 | taze config                                                               | KEEP              | Correctly scoped; update `nodeVersion: false` note once `devEngines` is the pin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### 3.2 TypeScript

| #   | Item                                                                                                | Verdict                                 | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | TypeScript **5.9.3**                                                                                | CHANGE → **6.0.3**                      | 6.0 is the official bridge to 7.0 ("code that compiles under 6.0 compiles identically under 7.0"). typescript-eslint 8.71 supports `<6.1`; Next 16.4 runs the project-local `tsc` CLI by default. **TS 7 trigger**: typescript-eslint declares TS 7 support (7.0 has no JS API) and Storybook/Next confirm. Supersedes ADR 0006's TS half.                                                                                                      |
| T2  | 6.0 default changes to absorb                                                                       | CHANGE                                  | `types: []` is the new default → add explicit `types` per preset; `lib.dom` now includes iterables → drop `DOM.Iterable`; `esModuleInterop` always on → drop the key; `noUncheckedSideEffectImports` on → CSS side-effect imports need ambient declarations (Next and Vite provide them; `packages/ui` gets one `declare module "*.css"`). No `baseUrl`, no `node10` resolution in use — nothing deprecated to migrate.                         |
| T3  | `isolatedModules`                                                                                   | CHANGE → `verbatimModuleSyntax`         | Official recommendation for both bundler and Node targets; it is the only setting that guarantees import/export elision is deterministic (required by Node type-stripping and every single-file transpiler). Churn: ~160 of 220 files lack `import type`; fixed mechanically by `@typescript-eslint/consistent-type-imports` autofix in one commit. Vendored shadcn files are touched — recorded as a documented deviation (ADR 0030 playbook). |
| T4  | `erasableSyntaxOnly`                                                                                | ADD                                     | Zero enums/namespaces/parameter properties in the tree (verified), so it is free today and keeps every package runnable by Node's stable type-stripping (24.12+). Pair with `verbatimModuleSyntax` per the 5.8 release notes.                                                                                                                                                                                                                   |
| T5  | `declaration`, `declarationMap`, `incremental: false`                                               | REMOVE                                  | Nothing emits (`noEmit` everywhere; packages are source-only by ADR 0016). Under `noEmit`, `declaration: true` still runs declaration emit internally for diagnostics — pure cost with no consumer. `incremental: false` is the default.                                                                                                                                                                                                        |
| T6  | Root `tsconfig.json`                                                                                | REMOVE                                  | Turborepo: "root tsconfig likely unnecessary; each package should have its own". It currently extends base with no `include`, i.e. an accidental whole-repo program for the editor. No root TS files exist.                                                                                                                                                                                                                                     |
| T7  | `paths` self-aliases in every package + `@workspace/ui/*` alias in `apps/web`                       | REMOVE                                  | Both resolvers (`bundler`, `nodenext`) honour `exports` and **self-name imports** natively; `paths` bypasses the `exports` boundary the ESLint rule protects, and Turborepo states JIT packages "cannot use `compilerOptions.paths`". Keep only `@/*` in `apps/web` (app-local, ADR 0028). Verify Vitest/Vite self-reference resolution during execution (tests pass today without aliases, which indicates it already works).                  |
| T8  | `packages/ui/tsconfig.lint.json`                                                                    | REMOVE                                  | create-turbo leftover; includes a `turbo/` dir that does not exist; nothing references it.                                                                                                                                                                                                                                                                                                                                                      |
| T9  | `module: NodeNext` base; Next preset `ESNext` + `Bundler`; React preset `react-jsx`                 | KEEP                                    | Matches TS "choosing compiler options" guidance for Node-run packages vs bundled apps. Relative imports already carry extensions (verified).                                                                                                                                                                                                                                                                                                    |
| T10 | `target: ES2022`, `lib`                                                                             | CHANGE                                  | Pin `target: es2024` + `lib: ["es2024", "dom"]` explicitly (Node 24 supports es2024; 6.0's floating default would drift). Target affects only type-checking here (Next/Vite transpile independently).                                                                                                                                                                                                                                           |
| T11 | `strict`, `noUncheckedIndexedAccess`, `moduleDetection: force`, `skipLibCheck`, `resolveJsonModule` | KEEP                                    | Add `noImplicitOverride` (free). **Not** `exactOptionalPropertyTypes` / `noPropertyAccessFromIndexSignature`: high churn in React props and `process.env`, little payoff — OPTIONAL.                                                                                                                                                                                                                                                            |
| T12 | `apps/web` `typecheck: tsc --noEmit`                                                                | CHANGE → `next typegen && tsc --noEmit` | Typed routes types live in `.next/types`; CI ordering of `typecheck` vs `build` is not guaranteed. Next docs recommend `next typegen` before `tsc` in CI.                                                                                                                                                                                                                                                                                       |
| T13 | Project references / `tsc -b`                                                                       | REJECT (documented)                     | A referenced project "may not disable emit" (TS6310) and must be `composite` → contradicts source-only packages; Turborepo explicitly recommends against them. Revisit only if TS 7's parallel `-b` is needed for speed at 50+ packages.                                                                                                                                                                                                        |

### 3.3 Lint & format

| #   | Item                                                                          | Verdict                                         | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | ESLint **9.39.5**                                                             | CHANGE → **10.12.0**                            | 9 is EOL + npm-deprecated; staying is a compliance finding. Supersedes ADR 0006's ESLint half.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| L2  | `eslint-plugin-react` 7.37                                                    | REMOVE → `@eslint-react/eslint-plugin`          | No ESLint 10 support, runtime failure (`getFilename`), issue open since February; the official create-turbo template dropped it. `@eslint-react` (5.24, peer `eslint: *`, TS-first, actively maintained) restores the valuable rules (`no-missing-key`, `no-children-prop`, …). Verify at execution; fallback = react-hooks 7 + `@next/eslint-plugin-next` only (template precedent).                                                                                                                                                               |
| L3  | `eslint-plugin-jsx-a11y`                                                      | KEEP (verify)                                   | Peer range stops at 9 but Next ships it with "ESLint 10 supported, expect peer warnings". a11y is a stated goal (ADR 0020). If a rule throws under 10, pin via `peerDependencyRules`/report upstream.                                                                                                                                                                                                                                                                                                                                               |
| L4  | `eslint-plugin-only-warn`                                                     | REMOVE (amends ADR 0005)                        | With `--max-warnings 0` the CI outcome is identical, but it erases the error/warning distinction everywhere else: boundary violations show as yellow squiggles, editors cannot prioritise, and `"error"` in our configs is a lie. Official template keeps it for "fewer severity decisions"; we already make those decisions deliberately. One fewer dependency.                                                                                                                                                                                    |
| L5  | Config duplication + prettier placement                                       | CHANGE                                          | `next.js`/`react-internal.js` re-spread `js.recommended`, `eslint-config-prettier`, `tseslint.recommended` after `base`; `eslint-config-prettier` must be **last** (later objects override). Rewrite with `defineConfig()` + `globalIgnores()` from `eslint/config` (9.22+/10 API; `tseslint.config()` is deprecated).                                                                                                                                                                                                                              |
| L6  | Type-aware linting                                                            | ADD                                             | `recommendedTypeChecked` with `projectService: true`. `no-floating-promises`/`no-misused-promises`/`await-thenable` are the highest-value rules for an auth+DB codebase (unawaited server actions are silent bugs). Cost: slower lint (Turbo caches it); initial findings to fix. Not `strict*` (not semver-stable per typescript-eslint).                                                                                                                                                                                                          |
| L7  | `turbo/no-undeclared-env-vars` via manual plugin wiring                       | CHANGE                                          | Use `eslint-config-turbo/flat` (official flat export).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| L8  | `apps/storybook` has no lint/typecheck script or config                       | ADD                                             | It is outside the gate today. Add `eslint.config.js` with `storybook.configs['flat/recommended']` + `globalIgnores(['!.storybook'])`, plus `lint`/`typecheck` scripts.                                                                                                                                                                                                                                                                                                                                                                              |
| L9  | Root `.eslintrc.js`                                                           | REMOVE                                          | eslintrc format is unreadable by ESLint 9 flat (default) and removed in 10; it only misleads editors/agents.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| L10 | Prettier 3.9.6, `--cache`, sort-imports → tailwind last, `tailwindStylesheet` | KEEP (bump 3.9.9)                               | All per official docs. Note: plugin bumps do not invalidate Prettier's cache — the `format` script should stay `--cache` but CI uses `--check` without cache (already does).                                                                                                                                                                                                                                                                                                                                                                        |
| L11 | `eslint --max-warnings 0` per package, `lint: dependsOn ^lint`                | KEEP                                            | Official Turborepo pattern (config package invalidation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| L12 | Dead-code / unused-dependency check                                           | ADD **knip**                                    | Finds unused files/exports/deps/catalog entries (pnpm catalog + Turbo plugin built in). Unused deps are supply-chain surface; unused exports rot boundaries. Run default + `--production` in CI.                                                                                                                                                                                                                                                                                                                                                    |
| L13 | Git hooks                                                                     | ADD (husky + lint-staged + commitlint)          | Deferred by ADR 0010/0004 "for now". Format failures are the most common CI round-trip; Prettier docs recommend pre-commit. `lint-staged` runs `prettier --write` + `eslint --max-warnings 0 --no-warn-ignored` on staged files only; `commit-msg` runs commitlint (Conventional Commits already in use). `HUSKY=0` in CI/Docker. Hooks are bypassable — the CI gate and PR-title check (C8) remain the enforcement. simple-git-hooks is the zero-dep alternative; husky chosen for documentation ubiquity (Prettier/commitlint docs reference it). |
| L14 | Editor config                                                                 | ADD `.vscode/settings.json` + `extensions.json` | `eslint.workingDirectories: [{ mode: "auto" }]`, Prettier as default formatter, format-on-save, workspace TS SDK, recommended extensions. VS Code docs: settings/extensions files are designed to be version-controlled.                                                                                                                                                                                                                                                                                                                            |

### 3.4 Package boundaries & structure

| #   | Item                                                                                              | Verdict                                    | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `apps/` + `packages/`, `@workspace/*` scope, config packages in `packages/`                       | KEEP                                       | Exactly Turborepo's documented structure ("`packages/*` for everything else, like libraries and tooling"). No `tooling/`, `configs/`, `scripts/` dirs — they would be empty inventions.                                                                                                                                                                                                                          |
| B2  | `apps/e2e`                                                                                        | CHANGE → `packages/e2e` (`@workspace/e2e`) | `apps/` should mean deployable. The e2e harness is tooling; moving it keeps `--filter=./apps/*` honest and the rule simple for the template. Six files, one CI path, one README.                                                                                                                                                                                                                                 |
| B3  | `exports` maps, no `main`, subpath patterns                                                       | KEEP                                       | Node's documented encapsulation mechanism; blocks `src/` deep imports structurally.                                                                                                                                                                                                                                                                                                                              |
| B4  | ESLint `no-restricted-imports` boundary rules (no `src/`, utils leaf, feature barrels, auth seam) | KEEP                                       | Cheap, explicit, documented (ADR 0016/0028).                                                                                                                                                                                                                                                                                                                                                                     |
| B5  | Dependency-direction enforcement beyond utils                                                     | ADD `turbo boundaries` (non-blocking)      | Turborepo Boundaries (experimental since 2.4) checks undeclared imports and cross-package file imports by default, and `tags` express direction (`utils` ← `domain` ← `ui` ← `apps`). Experimental → run in CI with `continue-on-error` until stable; record trigger. Rejected alternatives: `eslint-plugin-boundaries` (ESLint-only resolver config, no catalog awareness), Nx-style graph (ADR 0016 non-goal). |
| B6  | `transpilePackages` list in `next.config.ts`                                                      | REMOVE                                     | Next 16 docs: "Turbopack transpiles workspace packages … automatically under both routers." Only needed again with `output: 'standalone'` for `@t3-oss/env-core`.                                                                                                                                                                                                                                                |
| B7  | `packages/db/drizzle.config.ts` loads `apps/web/.env.local`                                       | KEEP (documented smell)                    | Sanctioned by ADR 0013 §1; becomes a real problem with a second app. Record the trigger in the env guide.                                                                                                                                                                                                                                                                                                        |
| B8  | `apps/web/hooks/.gitkeep`                                                                         | REMOVE                                     | Empty placeholder directory.                                                                                                                                                                                                                                                                                                                                                                                     |
| B9  | `packages/typescript-config` with no `lint` script, `packages/eslint-config` no `typecheck`       | KEEP                                       | JSON/JS-only; nothing to run.                                                                                                                                                                                                                                                                                                                                                                                    |

### 3.5 Build system (Turborepo)

| #   | Item                                                                                | Verdict                                      | Reasoning                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | turbo `^2.10.12`                                                                    | CHANGE → `^2.11.7`                           | Current; 2.11 honours `devEngines.packageManager`, faster start.                                                                                                                                                                                                                                                                                                  |
| R2  | `$schema: https://turbo.build/schema.json`                                          | CHANGE → `https://turborepo.dev/schema.json` | Two domain moves stale (still redirects).                                                                                                                                                                                                                                                                                                                         |
| R3  | `"ui": "tui"`                                                                       | KEEP                                         | Valid, non-default; CI gets stream output automatically.                                                                                                                                                                                                                                                                                                          |
| R4  | `test` with no `dependsOn`                                                          | CHANGE                                       | **Cache-correctness bug** in JIT packages (see §1). Add a transit node `topo: { dependsOn: ["^topo"] }` and make `lint`, `typecheck`, `test` depend on `topo` — Turborepo's documented pattern ("run in parallel while respecting source code changes from other packages"). Replaces `^lint`/`^typecheck` chains with the same correctness and more parallelism. |
| R5  | `build.outputs`                                                                     | CHANGE                                       | Add `!.next/dev/**` (official Next 16 pattern).                                                                                                                                                                                                                                                                                                                   |
| R6  | `globalPassThroughEnv`                                                              | CHANGE                                       | Correct for runtime secrets (not hashed). Move `BETTER_AUTH_URL` (feeds `metadataBase` at build) to `build.env`; keep the rest as pass-through. Add `"!NEXT_PUBLIC_*"` note is unnecessary (framework inference already hashes them).                                                                                                                             |
| R7  | `test:integration`, `test:e2e` uncached; e2e `^build`                               | KEEP                                         | Per ADR 0025 and docs.                                                                                                                                                                                                                                                                                                                                            |
| R8  | `--affected` in CI                                                                  | ADD                                          | On `pull_request`, run `turbo run … --affected` (auto-detects `GITHUB_BASE_REF`); full run on `main`. Add `--continue=dependencies-successful` so one failure does not hide others. Prerequisite: fetch the base ref (`fetch-depth: 0` is simplest at this repo size).                                                                                            |
| R9  | Remote cache                                                                        | OPTIONAL                                     | Documented path is Vercel Remote Cache via OIDC (`vercel/setup-turborepo-remote-cache-action`, no long-lived token) with `remoteCache.signature: true`; self-hosted via the open API spec if compliance forbids Vercel. Keep commented until a decision.                                                                                                          |
| R10 | Deprecated-for-3.0 flags (`--parallel`, `turbo-ignore`, `daemon`, `--graph` images) | KEEP (none used)                             | Document in the CI guide so they are not introduced.                                                                                                                                                                                                                                                                                                              |
| R11 | Package generator                                                                   | ADD `turbo gen`                              | `turbo/generators/config.ts` scaffolding a package (`package.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `README.md`, `src/index.ts`) so "add a package" is one command and conventions are enforced by construction.                                                                                                                         |

### 3.6 Testing architecture

| #   | Item                                                                                                  | Verdict                                      | Reasoning                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Three tiers (unit/component → integration with real Postgres → e2e), co-located tests, shared presets | KEEP                                         | Clear ownership: unit/component in the owning package; integration in `db`/`auth` using the `@workspace/db/testing` harness; e2e in its own workspace. Per-package Turbo tasks are what Turborepo's Vitest guide recommends over a root `projects` config (caching + affected).                                     |
| S2  | Vitest **4.1.11**                                                                                     | CHANGE → **5.0.3**                           | Blocker lifted: `@storybook/addon-vitest@10.6.1` peers `vitest ^5`. Migration: `clearMocks` default `true`, top-level `vi.mock`, removed sub-entrypoints, `.vitest/` artifacts (gitignore), coverage path semantics; companions pin **exactly** 5.0.3 → catalog lockstep. `oxc.jsx` key already correct for Vite 8. |
| S3  | Playwright `globalSetup` for DB reset                                                                 | CHANGE → `setup` project with `dependencies` | Official recommendation ("global setup lacks some features" — no trace/report/fixtures). The DB reset becomes a project step the authed project depends on.                                                                                                                                                         |
| S4  | Storybook build + browser tests not in CI                                                             | ADD job                                      | `turbo run build:storybook test --filter=storybook` with chromium. `addon-a11y` in `error` mode makes this an automated a11y gate for the design system.                                                                                                                                                            |
| S5  | Coverage report-only                                                                                  | KEEP                                         | ADR 0025: thresholds once a baseline exists.                                                                                                                                                                                                                                                                        |
| S6  | Testcontainers 12.1 → 12.2, Playwright 1.63                                                           | KEEP (minor bumps)                           | Node ≥ 22.22 satisfied. GitHub `ubuntu-latest` ships Docker, so integration needs no service container (already the case).                                                                                                                                                                                          |
| S7  | `storybook` test excluded from the unit job                                                           | KEEP                                         | Correct split (browser binaries).                                                                                                                                                                                                                                                                                   |

### 3.7 CI/CD

| #   | Item                                                                                                   | Verdict                                                   | Reasoning                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | SHA-pinned actions, `permissions: contents: read`, `persist-credentials: false`, concurrency, timeouts | KEEP                                                      | Matches the hardening guide. Bump `codeql-action` v3 → v4 when re-pinning.                                                                                                                                                              |
| C2  | Setup repeated in four jobs                                                                            | CHANGE → local composite action `./.github/actions/setup` | Official de-duplication mechanism for steps (reusable workflows are for whole jobs). Order: `pnpm/action-setup` → `setup-node cache: pnpm` → install. Switch to `pnpm/setup@v3` once on pnpm 11 (pnpm's README recommendation for 11+). |
| C3  | Single `ci` job runs format+lint+typecheck+build                                                       | KEEP (rename `check`)                                     | Add `pnpm dedupe --check` and `knip`.                                                                                                                                                                                                   |
| C4  | `merge_group` trigger                                                                                  | ADD                                                       | Required before a merge queue can ever be enabled ("status checks will not be triggered" otherwise); harmless now.                                                                                                                      |
| C5  | CodeQL `security-and-quality` weekly                                                                   | KEEP (annotate)                                           | Works because the repo is public. For template reuse on a **private** repo it fails without GitHub Code Security (Team/Enterprise) — document the gate in the workflow header.                                                          |
| C6  | `pnpm audit`                                                                                           | CHANGE                                                    | See D15.                                                                                                                                                                                                                                |
| C7  | `dependency-review-action`                                                                             | ADD                                                       | GitHub's official PR supply-chain gate: blocks new vulnerable deps and disallowed licences (`deny-licenses: AGPL-3.0, GPL-3.0` for a proprietary product). Free on public repos; same private-repo gate as CodeQL.                      |
| C8  | Conventional PR titles                                                                                 | ADD `amannn/action-semantic-pull-request`                 | With squash-merge, the PR title becomes the commit; `pull_request_target` with `pull-requests: read` and no checkout (safe pattern per docs).                                                                                           |
| C9  | Node floating (`.nvmrc`=`24`)                                                                          | CHANGE                                                    | See D3 — exact pin so CI and local match.                                                                                                                                                                                               |
| C10 | Playwright report upload, `reporter: github`                                                           | KEEP                                                      | Not sharded, so `github` reporter is fine.                                                                                                                                                                                              |
| C11 | Deployment / Docker                                                                                    | OPTIONAL                                                  | No target chosen (ADR 0013/0017). Documented path when chosen: `turbo prune --docker` + `output: 'standalone'` + `outputFileTracingRoot`. Adding an untested Dockerfile now would rot.                                                  |
| C12 | Release/versioning                                                                                     | OPTIONAL                                                  | Nothing is published; apps deploy from `main`. When a changelog is wanted: `release-please` (Conventional Commits, no publishing) or Changesets with `privatePackages: { version, tag }`. Not now.                                      |

### 3.8 Environment & configuration

| #   | Item                                                                                                             | Verdict                 | Reasoning                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `@workspace/env` on `@t3-oss/env-core`, zod 4, `emptyStringAsUndefined`, `SKIP_ENV_VALIDATION`, lint choke-point | KEEP                    | Matches t3-env docs ("create reusable env objects in shared packages"). Framework-agnostic by design (ADR 0013/0017).                                                |
| E2  | `server-only` on the env module                                                                                  | KEEP (documented limit) | Prevents importing it from `next.config.ts` for build-time validation; validation happens at first import during `next build` instead — equivalent for our purposes. |
| E3  | Per-app `.env.example`, no root env                                                                              | KEEP                    | Turborepo best practice.                                                                                                                                             |
| E4  | Build-time vs runtime vars in turbo.json                                                                         | CHANGE                  | See R6.                                                                                                                                                              |
| E5  | `experimental.typedEnv`                                                                                          | REJECT                  | Redundant with the validated env object.                                                                                                                             |

### 3.9 Git & repository hygiene

| #   | Item                                                        | Verdict                          | Reasoning                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | `.gitignore`                                                | CHANGE                           | Drop yarn/PnP noise; add `.vitest/`, `playwright/.auth/`; keep the rest.                                                                                                                                                      |
| G2  | `.gitattributes`, `.editorconfig`                           | KEEP                             | Correct; mark `skills-lock.json linguist-generated`.                                                                                                                                                                          |
| G3  | CODEOWNERS                                                  | CHANGE                           | Remove `apps/docs`; own security-sensitive paths explicitly (`packages/auth`, `packages/db`, `packages/env`, `.github/`, workspace/lock files); note team placeholders.                                                       |
| G4  | Issue templates                                             | ADD                              | Bug + feature forms, `config.yml` with `blank_issues_enabled: false` and a security contact link.                                                                                                                             |
| G5  | Rulesets on `main`                                          | ADD `.github/rulesets/main.json` | Codify ADR 0007's policy as importable JSON (require PR, strict status checks incl. the new jobs, conversation resolution, block force-push/deletion, linear history). Applying it is a GitHub-settings action for the owner. |
| G6  | Squash-merge default, delete-branch-on-merge                | CHANGE (owner action)            | Nine stale Dependabot branches today; linear history + Conventional PR titles depend on squash.                                                                                                                               |
| G7  | `.mcp.json` `npx shadcn@latest`, `next-devtools-mcp@latest` | CHANGE                           | Pin versions — unpinned `npx …@latest` executes whatever npm serves, which is exactly what `minimumReleaseAge` exists to prevent.                                                                                             |
| G8  | `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md`                    | CHANGE                           | Written for an open-source community ("fork", "good first issue"); rewrite CONTRIBUTING as the internal engineering workflow (branch → gate → ADR → PR → squash). Keep the CoC.                                               |
| G9  | `AGENTS.md` Next-managed block                              | KEEP                             | 16.3+ writes/updates the `nextjs-agent-rules` block; disabling (`agentRules: false`) would delete it on next `next dev`. Document that it is managed.                                                                         |

### 3.10 Documentation

| #   | Item                                                                                                                                                                                                                                                                                         | Verdict            | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X1  | ADRs (32), `future-improvements.md`, `references.md`                                                                                                                                                                                                                                         | KEEP               | The "why" is already excellent.                                                                                                                                                                                                                                                                                                                                                                                               |
| X2  | Stale statements (README seam/paths, ADR 0007 "one job", ADR 0017/0025 old paths, ADR 0024 Node claims, catalog jsdom comment, `future-improvements` typedRoutes/one-job/jsdom, `ci.yml` "ADR 0029" citation, `packages/ui` README double link, stock one-liner READMEs for config packages) | CHANGE             | Fix all of them; stale docs are negative value in a template.                                                                                                                                                                                                                                                                                                                                                                 |
| X3  | No single architecture/how-to layer                                                                                                                                                                                                                                                          | ADD `docs/guides/` | Short, pointer-heavy guides the user listed: repository structure, adding a package, adding an app, testing, dependencies, environment, CI/CD, release. Each links to the governing ADR instead of duplicating it.                                                                                                                                                                                                            |
| X4  | New ADRs                                                                                                                                                                                                                                                                                     | ADD                | 0033 Toolchain version policy & 2026-10 modernization (pnpm 11, Node pin, TS 6, ESLint 10, Vitest 5; supersedes 0006; amends 0005) · 0034 Single-version dependency policy (`catalogMode: strict`) · 0035 Task-graph correctness & affected CI (transit nodes, build-time env, `--affected`) · 0036 Package boundaries & dead-code enforcement (Boundaries tags, knip, `paths` removal) · 0037 Git hooks & commit governance. |

---

## 4. Target architecture

```text
monorepo-starter-kit/
├── .github/
│   ├── actions/setup/action.yml        # composite: pnpm → node (cache) → install
│   ├── workflows/
│   │   ├── ci.yml                      # check · test · integration · e2e · storybook  (+merge_group)
│   │   ├── codeql.yml                  # public repo / Code Security on private
│   │   ├── dependency-review.yml       # PR supply-chain + licence gate
│   │   └── pr-title.yml                # Conventional Commit titles (squash merge)
│   ├── ISSUE_TEMPLATE/{bug.yml,feature.yml,config.yml}
│   ├── rulesets/main.json              # importable branch ruleset (ADR 0007)
│   ├── CODEOWNERS · dependabot.yml · pull_request_template.md
├── .husky/{pre-commit,commit-msg}      # lint-staged · commitlint
├── .vscode/{settings.json,extensions.json}
├── apps/                               # DEPLOYABLES only
│   ├── web/                            # Next.js app (feature-first, ADR 0028)
│   └── storybook/                      # design-system site + browser tests
├── packages/                           # libraries + tooling (@workspace/*)
│   ├── ui/  auth/  db/  email/  env/  utils/     # domain & design-system packages (source-only)
│   ├── e2e/                            # Playwright harness (moved from apps/)
│   ├── eslint-config/  typescript-config/  vitest-config/   # shared tooling configs
├── turbo/generators/                   # `turbo gen package` scaffold (conventions by construction)
├── docs/
│   ├── decisions/                      # ADRs (0001–0037)
│   ├── guides/                         # structure · add-package · add-app · testing · deps · env · ci · release
│   ├── audits/                         # this document
│   ├── specs/ · future-improvements.md · references.md · bookmarks.md
├── .agents/skills/ · skills-lock.json  # vendored agent skills (ADR 0010)
├── AGENTS.md · CLAUDE.md               # single source of agent instructions (ADR 0008)
├── docker-compose.yml                  # local Postgres only
├── package.json                        # root: repo tools only (turbo, prettier, knip, husky, lint-staged, commitlint, taze, @turbo/gen)
├── pnpm-workspace.yaml                 # packages · catalog (ALL third-party deps) · pnpm settings (security defaults)
├── pnpm-lock.yaml · .npmrc (auth/registry only, or deleted) · .nvmrc (exact)
├── turbo.json · knip.config.ts · commitlint.config.js · taze.config.mjs
├── .prettierrc · .prettierignore · .editorconfig · .gitattributes · .gitignore · .mcp.json
└── README.md · CONTRIBUTING.md · SECURITY.md · CODE_OF_CONDUCT.md · LICENSE
```

**Responsibilities.** `apps/` = things that deploy. `packages/` = everything consumed by apps or by
the toolchain; a package is either a _domain/UI library_ (source-only, `exports`-encapsulated,
`@workspace/*`) or a _tooling config_ (`*-config`). `turbo/generators` = the only sanctioned way
to create a package. `docs/decisions` = why; `docs/guides` = how; `docs/audits` = periodic
re-evaluations like this one. The root `package.json` owns repo-wide tools only. No `tooling/`,
`configs/`, `scripts/`, `infra/` directories: each would be empty or duplicate `packages/`.

**Dependency direction (enforced):** `utils` → (`env`, `db`, `email`, `auth`) → `ui` → `apps`;
`*-config` packages are leaves consumed by everyone; `e2e` depends on `web` + `db/testing` only.

---

## 5. Current vs target

| Area             | Current                                                                               | Target                                                                                                                                                                | Why                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Package manager  | pnpm 10.34.5; settings split across `.npmrc`/workspace; security knobs partial        | pnpm 11.x pinned + self-managed; all settings in `pnpm-workspace.yaml`; `strictDepBuilds`, `blockExoticSubdeps`, `trustPolicy`, `verifyDepsBeforeRun`, `engineStrict` | Two majors behind; 11 makes our hand-set security defaults the baseline; `.npmrc` is auth-only from 11 |
| Runtime          | Node 24.13 local / "24" floating in CI; install broken                                | Exact `.nvmrc` 24.21.0 + `devEngines.runtime` + `engines >=24.15 <25`; dated Node 26 LTS trigger                                                                      | Reproducibility; the jsdom incident proves floating majors drift                                       |
| Workspace / deps | Catalog for shared deps, inline for the rest                                          | `catalogMode: strict`, every third-party dep in the catalog; knip + `dedupe --check` guards                                                                           | Single-version policy; one bump site for Dependabot/taze                                               |
| Build system     | Correct tasks but `test` uncorrelated to deps; build-time var unhashed; full-repo CI  | Transit node `topo`; `BETTER_AUTH_URL` in `build.env`; `--affected` on PRs; Boundaries tags (non-blocking)                                                            | Cache correctness; CI cost scales with change, not repo size                                           |
| TypeScript       | 5.9; `isolatedModules`; `declaration` with `noEmit`; `paths` aliases; root tsconfig   | 6.0.3; `verbatimModuleSyntax` + `erasableSyntaxOnly`; explicit `types`/`lib`/`target`; no `paths`; no root tsconfig                                                   | Bridge to TS 7; official module guidance; boundaries honest                                            |
| Lint             | ESLint 9 (EOL), duplicated configs, only-warn, no type-aware rules, Storybook ungated | ESLint 10, `defineConfig`, prettier last, `@eslint-react`, `recommendedTypeChecked`, Storybook in gate                                                                | EOL tool; real severities; promise-safety rules for auth/DB code                                       |
| Testing          | Vitest 4, Playwright globalSetup, Storybook tests not in CI                           | Vitest 5 lockstep, Playwright setup-project, Storybook build+browser job                                                                                              | Blocker resolved; official Playwright guidance; a11y gate                                              |
| CI               | 4 jobs × duplicated setup; report-only audit; no PR-title/dep-review; no merge_group  | Composite setup; `--affected`; audit blocking on fixable high; dependency-review; PR-title lint; `merge_group`; ruleset JSON                                          | Hardening guide + scale                                                                                |
| Security         | Good pinning; Dependabot alerts off; unpinned `npx @latest` in MCP                    | Alerts + security updates on; pinned MCP; licence gate; rulesets                                                                                                      | Close the gaps the template would otherwise propagate                                                  |
| Docs             | Excellent ADRs, stale details, no how-to layer                                        | Fixed facts; `docs/guides/`; 5 new ADRs; audit record                                                                                                                 | A template must explain _how_ as well as _why_                                                         |

---

## 6. What stays explicitly rejected (so it is not re-proposed)

- TypeScript project references / compiled internal packages (T13) — contradicts source-only
  packages; Turborepo and TS evidence above.
- Root-level Vitest `projects` config — defeats per-package caching/affected runs (Turborepo Vitest
  guide).
- Biome/oxlint as replacements — `references.md` watch-list stays; no evidence they cover
  react-hooks/compiler, a11y, Next and type-aware rules today.
- `tooling/`/`configs/`/`scripts/` directories — no content to justify them.
- Nx-style tag engine / `eslint-plugin-boundaries` — Boundaries + the existing ESLint rules suffice
  at this scale (ADR 0016).
- Changesets now — nothing is published (ADR 0002).
- pnpm 12 now — see D2.
- `exactOptionalPropertyTypes` etc. — churn without proportional value (T11).

---

## 7. Decisions that need your call before execution

| #   | Decision                                                                                        | Recommendation                          | If you disagree                                                                 |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | pnpm **11** now, 12 at trigger                                                                  | 11                                      | Say "12" — same migration, higher risk, I will add the extra verification steps |
| 2   | Single-version policy: `catalogMode: strict`, all deps in catalog                               | Yes                                     | Say "prefer" — keeps the current "shared only" convention                       |
| 3   | Drop `eslint-plugin-only-warn` (amend ADR 0005)                                                 | Yes                                     | Say "keep" — no CI impact either way                                            |
| 4   | Replace `eslint-plugin-react` with `@eslint-react/eslint-plugin`                                | Yes (fallback: none, like create-turbo) | Say "none"                                                                      |
| 5   | `verbatimModuleSyntax` with a one-time autofix commit touching ~160 files incl. vendored shadcn | Yes                                     | Say "skip" — keep `isolatedModules`                                             |
| 6   | Move `apps/e2e` → `packages/e2e`                                                                | Yes                                     | Say "keep"                                                                      |
| 7   | Git hooks: husky + lint-staged + commitlint                                                     | Yes                                     | Say "simple-git-hooks" or "no hooks"                                            |
| 8   | `pnpm audit` blocking at high/fixable                                                           | Yes                                     | Say "advisory"                                                                  |
| 9   | Dependabot npm cadence monthly (from quarterly)                                                 | Yes                                     | Say "quarterly"                                                                 |
| 10  | Type-aware lint (`recommendedTypeChecked`)                                                      | Yes                                     | Say "subset" (only promise rules)                                               |

**Owner-only actions (I cannot do these):** install Node ≥ 24.15 locally (24.21.0; or accept
the pnpm-managed runtime once `devEngines` lands — I will verify which works first) · GitHub
settings: enable Dependabot alerts + security updates and dependency graph, import the ruleset,
set squash-merge default + delete-branch-on-merge, set Actions policy "require SHA pinning" and
workflow permissions read-only · optional: Vercel remote-cache team for OIDC.

---

## 8. Execution plan (ordered; each phase ends green and committed)

Branch: `chore/foundation-2026-10`. Conventional Commits, one logical change each. Gate after
every phase: `pnpm install --frozen-lockfile` → `pnpm format` → `pnpm lint` → `pnpm typecheck` →
`pnpm build` → `pnpm test` (+ `test:integration`/`test:e2e`/Storybook build where Docker is
available locally; otherwise in CI on the PR). Pushing and opening the PR happens only when you
say so.

### Phase 0 — Unblock the install (prerequisite)

0.1 Node ≥ 24.15 available (owner) **or** verify pnpm-managed runtime.
0.2 `engines.node >=24.15.0 <25`, `.nvmrc` 24.21.0, fix the stale jsdom catalog comment.
0.3 `pnpm install --frozen-lockfile`; baseline gate run; record timings for before/after.

### Phase 1 — Toolchain majors (one commit each, gate between)

1.1 pnpm 11: `packageManager` → latest-11; `.npmrc` → `engineStrict` in workspace yaml; add
`strictDepBuilds`, `blockExoticSubdeps`, `trustPolicy`, `verifyDepsBeforeRun`; `devEngines.runtime`;
regenerate lockfile (`pnpm install`); confirm `pnpm dedupe --check`.
1.2 Catalog: `catalogMode: strict`; move every third-party dep into the catalog; remove root
`@workspace/*-config` devDeps; move `@turbo/gen` to root; remove `@chromatic-com/storybook`.
1.3 TypeScript 6.0.3 + preset rewrite (T2–T5, T10, T11); remove root tsconfig and
`tsconfig.lint.json`; remove `paths`; `next typegen` in web typecheck. Fix any new diagnostics.
1.4 `verbatimModuleSyntax`: add `consistent-type-imports` (inline style) → `eslint --fix` → commit
separately as `refactor(types): …` (mechanical; reviewable as one diff).
1.5 ESLint 10 + config rewrite (L1–L8): `defineConfig`, prettier last, `@eslint-react`,
type-aware rules, `eslint-config-turbo/flat`, Storybook config + scripts, delete `.eslintrc.js`.
Fix findings; where a type-aware rule is noisy, decide per rule and record in ADR 0033.
1.6 Vitest 5 lockstep (S2) + `.vitest/` ignore; Storybook 10.6.1; Next 16.4.0 (`partialPrefetching`,
drop `transpilePackages`); Prettier 3.9.9; turbo 2.11.7; Testcontainers 12.2. Read each changelog
first (repo rule).

### Phase 2 — Task graph, boundaries, hygiene

2.1 `turbo.json`: schema URL, `topo` transit node, `!.next/dev/**`, `build.env` for `BETTER_AUTH_URL`,
`boundaries` tags + per-package `tags`; `turbo boundaries` local run.
2.2 Move `apps/e2e` → `packages/e2e`; Playwright setup-project for the DB reset; update CI paths/docs.
2.3 knip config + first run; delete what it finds (unused files/exports/deps); keep `knip` as a
root script.
2.4 `.gitignore`/`.gitattributes` tidy; `.mcp.json` pins; remove `apps/web/hooks/.gitkeep`;
`.vscode/`.
2.5 `turbo/generators/config.ts` package scaffold; dry-run it to create a throwaway package, then
delete the output.

### Phase 3 — CI & governance

3.1 Composite setup action; `ci.yml` rewrite: `check` (format, lint, typecheck, build, dedupe,
knip; `--affected` on PRs), `test`, `integration`, `e2e`, `storybook`; `merge_group`;
`--continue=dependencies-successful`; audit blocking policy; codeql-action v4.
3.2 `dependency-review.yml`, `pr-title.yml`, issue templates, CODEOWNERS fix, `rulesets/main.json`,
Dependabot cadence/ignores update.
3.3 Hooks: husky, lint-staged, commitlint; `HUSKY=0` in CI composite.

### Phase 4 — Documentation & ADRs

4.1 Fix every stale statement listed in X2 (README, ADR 0007/0016/0017/0024/0025, comments).
4.2 `docs/guides/*` (eight short guides); rewrite CONTRIBUTING; update AGENTS.md commands/conventions
(keep it lean: pointers, not prose); README structure block; package READMEs for config packages.
4.3 ADRs 0033–0037; amend 0005/0006/0016/0025 with "superseded/amended by" notes; update the index
and `future-improvements.md` (remove done items, add the dated Node 26 / pnpm 12 / TS 7 triggers).

### Phase 5 — Validation (§9) and hand-off

Full gate, task-graph dry-run review, boundaries, knip, lockfile diff review, `git status`, then
push + PR on your go. Final report in the format you asked for (§23 of the brief).

---

## 9. Validation checklist (what "done" means)

- `pnpm install --frozen-lockfile` succeeds on Node 24.21.0 with pnpm 11; `pnpm dedupe --check` clean
- `pnpm format` idempotent; `prettier --check .` clean
- `turbo run lint typecheck build` green with **zero warnings**, all packages (incl. storybook)
- `turbo run test` green; `test:integration` green (Docker); `test:e2e` green (compose Postgres);
  `build:storybook` + storybook browser tests green
- `turbo run build --dry=json`: every task's `dependencies` include its package's `topo`; build hash
  inputs list `BETTER_AUTH_URL`
- `turbo boundaries` clean; `knip` and `knip --production` clean
- No `paths` left except `@/*`; `grep -r "src/" exports` shows only `exports` maps
- CI workflow YAML validated (`actionlint` if available, else a PR run); all actions SHA-pinned
- `git status` clean on the branch; lockfile diff reviewed line-by-line for unexpected majors
- Every stale statement in X2 resolved; ADR index updated

---

## 10. Risks & trade-offs (honest)

- **Scope of churn.** Phases 1.3–1.5 touch most files (type-import autofix, lint rewrite). Mitigated
  by one mechanical commit per concern and a green gate between each.
- **ESLint 10 plugin maturity.** `jsx-a11y` is untested on 10 by its own maintainers; `@eslint-react`
  is new to this repo. Fallback documented (L2/L3); nothing blocks the upgrade itself.
- **pnpm 11 on Windows.** Earlier attempt failed via Corepack; the self-managed path is different.
  If it fails here, the fallback is the standalone installer — not a reason to stay on 10.
- **Type-aware lint findings.** Unknown count until run; could surface real bugs (good) or noise
  (tune per rule, recorded).
- **Vitest 5 `clearMocks` default** may change behaviour in tests relying on call history across
  tests; the suite already calls `clearAllMocks` in `beforeEach`, so low risk.
- **`catalogMode: strict`** adds friction to `pnpm add` (must be catalog-first). That friction is the
  point; the generator and the dependency guide make it one step.
- **Node 26 in three weeks.** We pin 24 now and bump at the LTS date rather than adopt a Current
  release — a deliberate, dated choice.
- **Template vs this product.** Several items (CodeQL, dependency-review, rulesets on Free plans)
  behave differently on private repos; each is annotated so a derived private repo knows what it
  must license or drop.
- **Hooks are bypassable** (`--no-verify`); CI and the ruleset remain the enforcement.

---

## 11. Reusable template principles (to extract after execution)

1. **Pin exactly what reproducibility depends on** (Node, pnpm, actions by SHA); range only what
   semver can be trusted for, and verify every bump against its changelog.
2. **One version per third-party dependency** across the workspace (catalog, strict).
3. **Packages are source-only, `exports`-encapsulated, and never aliased**; consumers import
   public subpaths only.
4. **The task graph must be correct before it is fast**: every cached task declares what it
   reads (transit nodes, build-time env in `env`).
5. **Every tool has an owner and a trigger**: deferred upgrades carry a dated or testable trigger,
   never "later".
6. **CI = composable setup + affected runs + blocking gates for things that are fixable**
   (format, lint, types, build, tests, fixable advisories) and **advisory for the rest**.
7. **Boundaries are enforced by tooling, not prose** (ESLint rules, Boundaries tags, knip).
8. **Docs come in three layers**: ADR (why), guide (how), audit (re-check), and stale docs are
   treated as bugs.
9. **Security defaults on by default** (pnpm supply-chain settings, least-privilege CI, pinned
   `npx`), with explicit notes where a hosting plan changes what is available.
10. **The baseline is the maintainers' current reference setup**, deviations are recorded.

---

## 12. Official references used

- pnpm: https://pnpm.io/settings · https://pnpm.io/catalogs · https://pnpm.io/supply-chain-security ·
  https://pnpm.io/migration · https://pnpm.io/blog/releases/11.0 · https://pnpm.io/blog/releases/12.0 ·
  https://pnpm.io/package_json · https://pnpm.io/cli/dedupe · https://pnpm.io/cli/audit ·
  https://github.com/pnpm/pnpm/releases
- Node: https://github.com/nodejs/Release · https://nodejs.org/api/typescript.html ·
  https://nodejs.org/api/packages.html · https://github.com/nodejs/corepack#readme
- TypeScript: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/ ·
  https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ ·
  https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html ·
  https://www.typescriptlang.org/docs/handbook/modules/reference.html ·
  https://www.typescriptlang.org/docs/handbook/project-references.html
- Turborepo: https://turborepo.dev/docs/core-concepts/internal-packages ·
  https://turborepo.dev/docs/guides/tools/typescript · https://turborepo.dev/docs/guides/tools/eslint ·
  https://turborepo.dev/docs/guides/tools/vitest · https://turborepo.dev/docs/reference/configuration ·
  https://turborepo.dev/docs/crafting-your-repository/using-environment-variables ·
  https://turborepo.dev/docs/crafting-your-repository/constructing-ci ·
  https://turborepo.dev/docs/reference/boundaries · https://turborepo.dev/docs/guides/ci-vendors/github-actions ·
  https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- ESLint & co: https://eslint.org/version-support/ · https://eslint.org/docs/latest/use/migrate-to-10.0.0 ·
  https://eslint.org/docs/latest/use/configure/configuration-files · https://typescript-eslint.io/users/configs ·
  https://typescript-eslint.io/getting-started/typed-linting · https://github.com/prettier/eslint-config-prettier ·
  https://github.com/jsx-eslint/eslint-plugin-react/issues/3977 · https://registry.npmjs.org/@eslint-react/eslint-plugin/latest ·
  https://nextjs.org/docs/app/api-reference/config/eslint · https://storybook.js.org/docs/configure/integration/eslint-plugin
- Prettier / hooks: https://prettier.io/docs/cli · https://prettier.io/docs/precommit ·
  https://typicode.github.io/husky/get-started.html · https://github.com/lint-staged/lint-staged ·
  https://commitlint.js.org/guides/getting-started.html · https://knip.dev/features/monorepos-and-workspaces
- Next / tests: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages ·
  https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents ·
  https://nextjs.org/docs/app/api-reference/cli/next · https://env.t3.gg/docs/customization ·
  https://vitest.dev/guide/migration · https://vitest.dev/guide/projects ·
  https://playwright.dev/docs/test-global-setup-teardown · https://playwright.dev/docs/ci ·
  https://node.testcontainers.org/configuration/ · https://registry.npmjs.org/@storybook/addon-vitest
- GitHub: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions ·
  https://docs.github.com/en/actions/sharing-automations/avoiding-duplication ·
  https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference ·
  https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review ·
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets ·
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue ·
  https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security ·
  https://github.com/amannn/action-semantic-pull-request
