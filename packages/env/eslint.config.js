import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([
  ...config,
  typeAware(import.meta.dirname),
  {
    // This package is the ONE place allowed to read `process.env` — it validates it
    // and re-exports the typed result for everyone else (ADR 0013).
    files: ["src/**/*.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
]);
