import { defineConfig, globalIgnores } from "eslint/config";

import { config, nodeGlobals, typeAware } from "@workspace/eslint-config/base";

// Root-level repo tooling only: `scripts/`, the package generator, knip/commitlint/taze configs.
// Workspace packages have their own eslint.config.js; ESLint 10 resolves per file directory,
// so this file never applies to them. Type-aware rules use the root tsconfig (tooling files).
export default defineConfig([
  // Vendored agent skills ship their own assets (ADR 0010); git hooks are shell.
  globalIgnores([".agents/**", ".husky/**"]),
  ...config,
  typeAware(import.meta.dirname),
  {
    // Node CLI scripts and ESM configs: Node globals, and process.env / process.exit are the point.
    files: ["scripts/**/*.{js,mjs,cjs}", "*.{js,mjs,cjs}"],
    ...nodeGlobals,
    rules: { "no-restricted-syntax": "off" },
  },
]);
