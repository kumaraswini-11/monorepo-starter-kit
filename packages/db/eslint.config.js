import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([
  ...config,
  typeAware(import.meta.dirname),
  {
    // The integration-test env bootstrap must set `process.env` directly (it points the
    // lazily-connecting db client at the ephemeral container before @workspace/env loads),
    // so the ADR 0013 "no direct process.env" rule doesn't apply here. (ADR 0025 §11)
    files: ["test/**"],
    rules: { "no-restricted-syntax": "off" },
  },
]);
