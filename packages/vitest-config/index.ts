import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";

/**
 * Shared Vitest presets (ADR 0029). Both live in one file so neither needs a relative
 * `./base` import — that would force `allowImportingTsExtensions` on every consumer's tsc.
 */

// `server-only` / `client-only` are build-time environment guards that throw when resolved
// outside their target (Node/Vitest has no `react-server` condition, so `server-only`
// throws). They're irrelevant under test — alias both to an empty module.
const noop = fileURLToPath(new URL("./noop.ts", import.meta.url));

/**
 * Base preset — Node environment, co-located `src/**\/*.test.ts`. Pure, non-DOM packages
 * (`@workspace/utils`, `@workspace/auth`, …) use it:
 * `export { base as default } from "@workspace/vitest-config"`.
 */
export const base = defineConfig({
  resolve: {
    alias: {
      "server-only": noop,
      "client-only": noop,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Coverage is inert until `--coverage` is passed. Report-only for now (ADR 0029):
    // thresholds are added once a baseline exists. v8 provider (matches the repo).
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js,mjs,cjs}",
        "**/vitest.d.ts",
        "**/*.stories.tsx",
      ],
    },
  },
});

/**
 * DOM (component) preset — jsdom + Testing Library matchers via the shared `setup`. JSX/TSX
 * is transformed by Vitest's built-in esbuild (no `@vitejs/plugin-react` unless testing
 * React-Compiler output). `globals: true` enables React Testing Library's automatic cleanup
 * between tests; test files still import `describe`/`it`/`expect` explicitly.
 *
 * Consuming packages add these devDependencies themselves (they resolve from the consumer,
 * not this package): `jsdom`, `@testing-library/react`, `@testing-library/user-event`, and
 * `@testing-library/jest-dom` (plus a one-line `vitest.d.ts` importing
 * `@testing-library/jest-dom/vitest` for the matcher types). Apps whose tests don't live
 * under `src/` (e.g. `apps/web`) override `test.include`.
 */
export const dom = mergeConfig(
  base,
  defineConfig({
    // Force the automatic JSX runtime for tests regardless of the consumer's on-disk
    // tsconfig. apps/web extends Next's config (`jsx: "preserve"`), which would otherwise
    // leave JSX untransformed and fail the parse. Vite 8 is rolldown/oxc-based, so JSX
    // settings live under `oxc.jsx` (the `esbuild` key is ignored here). (ADR 0029)
    oxc: {
      jsx: {
        runtime: "automatic",
        importSource: "react",
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["@workspace/vitest-config/setup"],
      globals: true,
    },
  })
);
