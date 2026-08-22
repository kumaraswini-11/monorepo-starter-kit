import { defineConfig, mergeConfig } from "vitest/config";

import { base } from "./base.ts";

/**
 * DOM (component) Vitest config (ADR 0029) — jsdom + Testing Library matchers via the
 * shared `setup`. JSX/TSX is transformed by Vitest's built-in esbuild, so no
 * `@vitejs/plugin-react` is needed unless testing React-Compiler output (rare).
 *
 * Consuming packages add these devDependencies themselves, because they're resolved from
 * the consumer, not this config: `jsdom` (the environment Vitest loads by name),
 * `@testing-library/react` + `@testing-library/user-event` (imported by the test files).
 * Apps whose tests don't live under `src/` (e.g. `apps/web`) override `test.include`.
 */
export const dom = mergeConfig(
  base,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["@workspace/vitest-config/setup"],
    },
  })
);
