import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import turboPlugin from "eslint-plugin-turbo";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint configuration for every workspace package (ADR 0005, ADR 0033).
 *
 * Shape: `core` is the rule set WITHOUT the Prettier override; the exported `config` (and
 * the React/Next variants in the sibling files) append `eslint-config-prettier` as the LAST
 * entry, because later flat-config objects override earlier ones and Prettier owns all
 * formatting (ADR 0004). Consumers spread an exported config and add overrides after it.
 *
 * Type-aware linting (`recommendedTypeChecked`) is on: unawaited promises in server actions,
 * misused async handlers and unsafe `any` flows are the bugs that matter most in an auth +
 * database codebase. It needs a TypeScript program; `projectService` finds each file's
 * nearest tsconfig. Call `typeAware(import.meta.dirname)` in each package so the root is
 * explicit instead of cwd-dependent (typescript-eslint monorepo guidance).
 */

/** Build output, caches and reports — never linted. */
export const ignores = globalIgnores([
  "**/dist/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/storybook-static/**",
  "**/playwright-report/**",
  "**/test-results/**",
  "**/.vitest/**",
]);

/**
 * Pin the TypeScript project root for type-aware rules to the calling package.
 * @param {string} tsconfigRootDir pass `import.meta.dirname`
 */
export const typeAware = (tsconfigRootDir) => ({
  // TypeScript sources only: plain JS config files are linted without a program (see the
  // disableTypeChecked override in `core`), and this entry must not re-enable it for them.
  files: ["**/*.{ts,tsx,mts,cts}"],
  languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
});

export const core = [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    // Plain JS/MJS/CJS config files (eslint.config.js, postcss.config.mjs, …) are not part of
    // a TypeScript program; lint them without type information.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  turboPlugin.configs["flat/recommended"],
  {
    // An env var a task reads but turbo.json doesn't declare silently escapes the cache
    // hash (ADR 0013). Error, not warning: it is a cache-correctness bug.
    rules: { "turbo/no-undeclared-env-vars": "error" },
  },
  {
    // verbatimModuleSyntax (typescript-config/base.json) requires type-only imports to be
    // marked; these two rules make that mechanical (autofixable) and keep the elision
    // deterministic for every single-file transpiler (Turbopack, Vite, Node type-stripping).
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },
  {
    // Guard: force everyone through the validated `@workspace/env` contract instead of
    // reading `process.env` directly (which silently masks missing config — ADR 0013).
    // Exemptions below for config/tooling files; the env package exempts itself.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Import validated env from `@workspace/env`; don't read `process.env` directly (ADR 0013).",
        },
      ],
    },
  },
  {
    // Config/tooling files (drizzle-kit, next, vitest, eslint, playwright) run before/outside
    // the app and legitimately read process.env.
    files: ["**/*.config.{js,ts,mjs,cjs}"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Module boundaries (ADR 0016 §Governance): consumers go through a package's `exports`
    // map — never reach into its `src/`. Keeps internals swappable + the public surface honest.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@workspace/*/src/*", "@workspace/*/src/**"],
              message:
                "Deep import bypasses the package's exports map — import from its public entry (e.g. `@workspace/ui/components/...`), not `src/` (ADR 0016).",
            },
          ],
        },
      ],
    },
  },
];

/** Base config for non-React packages. Prettier last (ADR 0004). */
export const config = defineConfig([...core, eslintConfigPrettier]);

/** Node globals for plain JS tooling files (scripts, ESM configs) that no tsconfig covers. */
export const nodeGlobals = {
  languageOptions: { globals: { ...globals.node } },
};
