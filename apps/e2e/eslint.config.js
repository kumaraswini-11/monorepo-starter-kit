import { config } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    // The Playwright global-setup legitimately reads `process.env.DATABASE_URL` (the e2e DB,
    // provided by docker-compose / a CI service) — the ADR 0021 "no direct process.env" rule
    // doesn't apply to this test bootstrap. (playwright.config.* is already exempt.)
    files: ["global-setup.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];
