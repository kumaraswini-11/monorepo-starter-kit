import { defineConfig, mergeConfig } from "vitest/config";

import { integration } from "@workspace/vitest-config";

/**
 * Integration tests for @workspace/db — real Postgres via Testcontainers (ADR 0025 §11).
 * The shared `integration` preset provides the node env + serial run + `*.integration.test.ts`
 * matching; this package owns the container/migration harness under `test/`.
 */
export default mergeConfig(
  integration,
  defineConfig({
    test: {
      globalSetup: ["./test/global-setup.ts"],
      setupFiles: ["./test/setup-env.ts", "./test/teardown.ts"],
    },
  })
);
