import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([
  ...config,
  typeAware(import.meta.dirname),
  {
    // The database setup project legitimately reads `process.env.DATABASE_URL` (the e2e DB,
    // provided by docker-compose / a CI service) — the ADR 0013 "no direct process.env" rule
    // doesn't apply to this test bootstrap. (playwright.config.* is already exempt.)
    files: ["tests/db.setup.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
]);
