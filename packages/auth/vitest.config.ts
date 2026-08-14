import { defineConfig } from "vitest/config";

/**
 * Unit tests for this package. Node environment (no DOM) and co-located `*.test.ts`
 * files next to the code they test — the template pattern any package can copy.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
