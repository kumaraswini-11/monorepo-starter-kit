import { defineConfig, mergeConfig } from "vitest/config";

import { dom } from "@workspace/vitest-config";

/**
 * Component tests for apps/web — the shared jsdom `dom` preset (ADR 0025), with two
 * app-specific overrides:
 * - `include`: this app's tests live under app/ · components/ · lib/, not `src/`.
 * - `resolve.alias`: map the `@/*` tsconfig path (Vitest doesn't read tsconfig paths) so
 *   components importing `@/lib/...` resolve in tests.
 */
export default mergeConfig(
  dom,
  defineConfig({
    resolve: {
      alias: { "@": import.meta.dirname },
    },
    test: {
      include: ["{app,components,lib}/**/*.test.{ts,tsx}"],
    },
  })
);
