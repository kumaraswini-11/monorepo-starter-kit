import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    // Guard: force everyone through the validated `@workspace/env` contract instead
    // of reading `process.env` directly (which silently masks missing config —
    // ADR 0021). Exemptions below for the env package itself + config/tooling files.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Import validated env from `@workspace/env`; don't read `process.env` directly (ADR 0021).",
        },
      ],
    },
  },
  {
    // Config/tooling files (drizzle-kit, next, vitest, eslint) run before/outside the
    // app and legitimately read process.env.
    files: ["**/*.config.{js,ts,mjs,cjs}"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**"],
  },
];
