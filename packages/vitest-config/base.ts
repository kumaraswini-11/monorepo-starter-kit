import { defineConfig } from "vitest/config";

/**
 * Shared base Vitest config (ADR 0029) — Node environment, co-located `*.test.ts` next to
 * the code. Packages of pure, non-DOM logic (`@workspace/utils`, `@workspace/auth`, …)
 * extend this: `export { base as default } from "@workspace/vitest-config/base"`.
 */
export const base = defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
