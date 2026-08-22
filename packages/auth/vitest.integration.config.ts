import { defineConfig, mergeConfig } from "vitest/config";

import { integration } from "@workspace/vitest-config";

/**
 * Integration tests for @workspace/auth — real Better Auth flows against real Postgres
 * (ADR 0029 §11). Reuses the shared Testcontainers harness owned by @workspace/db (one
 * container per run; env pointed at it before the auth instance's db client connects).
 */
export default mergeConfig(
  integration,
  defineConfig({
    test: {
      globalSetup: ["@workspace/db/testing/global-setup"],
      setupFiles: ["@workspace/db/testing/setup-env"],
    },
  })
);
