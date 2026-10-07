# Adding an app

Governing decisions: [0017](../decisions/0017-backend-architecture-and-migration.md) (when a
second service is warranted), [0013](../decisions/0013-env-and-secrets-management.md) (per-app
env), [0023](../decisions/0023-app-shell-routing-and-boundaries.md) / [0028](../decisions/0028-app-code-feature-architecture.md)
(app-code shape), [0035](../decisions/0035-task-graph-correctness-and-affected-ci.md) (tasks).

An **app is a deployable**. Triggers for a new one are named in ADR 0017 (a second non-web
client, a dedicated backend team, heavy async/WebSocket work, a compliance boundary). There is
no generator for apps on purpose — each framework has its own scaffold; use it, then apply the
checklist below.

## Checklist

1. **Location & name**: `apps/<name>`, unscoped package name (`web`, `storybook`, …),
   `private: true`, `license: "UNLICENSED"`.
2. **Dependencies**: every third-party dependency via `catalog:` (ADR 0034); workspace packages
   via `workspace:*`. A statically built site (Storybook) has only devDependencies.
3. **Presets**: `tsconfig.json` extends `@workspace/typescript-config/nextjs.json` (Next) or
   `react-library.json`; `eslint.config.js` spreads `nextJsConfig` or `config` from
   `@workspace/eslint-config` and adds `typeAware(import.meta.dirname)`; tests use the
   `@workspace/vitest-config` presets.
4. **Tasks**: scripts named `dev`, `build`, `lint`, `typecheck`, `test` so the root `turbo`
   tasks pick them up; `build` must declare `outputs` in `turbo.json` if its output directory
   is new (Next's `.next/**` is already covered). Add build-time env vars to `build.env`.
5. **Boundaries**: `turbo.json` with `"tags": ["app"]` — nothing may depend on an app except
   the e2e harness.
6. **Env**: `.env.example` in the app, `.env.local` git-ignored; read through `@workspace/env`
   (add a preset there if the app has its own variables — t3-env `extends`).
7. **Feature-first code** (`features/<name>/` with a barrel, `@/*` alias only — ADR 0028).
8. **CI**: nothing to add for lint/typecheck/build/test (affected runs cover it); e2e needs a
   second `webServer` entry in `packages/e2e/playwright.config.ts` (it is an array for this
   reason) and a Postgres service if the app is DB-backed.
9. **Deployment**: not decided yet (ADR 0013/0017). When it is: `output: 'standalone'` +
   `outputFileTracingRoot` and `turbo prune --docker` are the documented monorepo path.
