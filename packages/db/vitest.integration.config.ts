import { defineConfig, mergeConfig } from "vitest/config";

import { base } from "@workspace/vitest-config";

/**
 * Integration tests for @workspace/db — real Postgres via Testcontainers (ADR 0029 §11).
 * Separate from the fast unit loop: matches `*.integration.test.ts`, starts a container in
 * global setup, and points env at it per worker. Run serially (shared DB) and allow time
 * for the first image pull + migrations.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["src/**/*.integration.test.ts"],
      globalSetup: ["./test/global-setup.ts"],
      setupFiles: ["./test/setup-env.ts"],
      fileParallelism: false,
      testTimeout: 30_000,
      hookTimeout: 120_000,
    },
  })
);
