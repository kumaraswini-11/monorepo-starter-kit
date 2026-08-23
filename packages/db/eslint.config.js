import { config } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    // The integration-test env bootstrap must set `process.env` directly (it points the
    // lazily-connecting db client at the ephemeral container before @workspace/env loads),
    // so the ADR 0021 "no direct process.env" rule doesn't apply here. (ADR 0029 §11)
    files: ["test/**"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];
