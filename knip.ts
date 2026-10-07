import type { KnipConfig } from "knip";

/**
 * knip — dead-code and dependency hygiene (ADR 0036): unused files, exports, dependencies and
 * pnpm catalog entries. Workspaces come from pnpm-workspace.yaml; plugins (next, vitest,
 * playwright, storybook, eslint, prettier, turbo, …) enable themselves when the tool is present
 * and read its config for entry files. Run `pnpm knip` (dev) and `pnpm knip:production` (what
 * ships); both run in CI. Every exception below names the reason, so a NEW finding is a real one.
 */
const config: KnipConfig = {
  // Vendored agent skills (ADR 0010) ship their own assets; not this repo's code.
  ignore: [".agents/**"],
  workspaces: {
    ".": {
      // Tool configs knip has no plugin for (the turbo plugin covers turbo/generators).
      entry: ["taze.config.mjs"],
    },
    "apps/web": {
      // Resolved by PostCSS from the app directory (see packages/ui/postcss.config.mjs).
      ignoreDependencies: ["@tailwindcss/postcss"],
    },
    "packages/auth": {
      // Two Vitest configs: unit + integration (ADR 0025 §11). The unit config re-exports a
      // shared preset, which knip cannot evaluate, so the test entries are listed explicitly.
      vitest: {
        config: ["vitest.config.ts", "vitest.integration.config.ts"],
        entry: ["src/**/*.test.ts"],
      },
    },
    "packages/db": {
      vitest: { config: ["vitest.integration.config.ts"] },
    },
    "packages/e2e": {
      // Playwright setup projects use the `*.setup.ts` suffix (playwright.config.ts projects).
      playwright: { entry: ["tests/**/*.{spec,setup}.ts"] },
      // This whole package is a test harness with no production surface: dev-mode project files
      // only (no `!` suffix), so `--production` has nothing to report here by design.
      project: ["**/*.ts"],
      // `web` is not imported — it is the app under test; declaring it makes
      // `test:e2e` depend on `web#build` in the Turborepo graph (turbo.json).
      ignoreDependencies: ["web"],
    },
    "packages/typescript-config": {
      // The `next` tsconfig plugin resolves from the consuming app, not this package.
      ignoreUnresolved: ["next"],
    },
  },
};

export default config;
