import { config } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    // This package is the ONE place allowed to read `process.env` — it validates it
    // and re-exports the typed result for everyone else.
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];
