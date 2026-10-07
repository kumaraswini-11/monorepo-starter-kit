import eslintReact from "@eslint-react/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { core } from "./base.js";

/**
 * React rules shared by React libraries (packages/ui) and the Next.js app. Exported WITHOUT
 * the Prettier override so `next.js` can layer on top; `config` below appends it.
 *
 * - `@eslint-react` replaces `eslint-plugin-react` (no ESLint 10 support upstream — ADR 0033);
 *   its TypeScript preset drops the prop-types / JSX-scope rules the automatic JSX runtime
 *   makes redundant.
 * - `eslint-plugin-react-hooks` 7 ships the React Compiler rules in `flat.recommended`.
 */
export const react = [
  eslintReact.configs["recommended-typescript"],
  reactHooks.configs.flat.recommended,
  { languageOptions: { globals: { ...globals.browser } } },
];

/** Config for React libraries. Prettier last (ADR 0004). */
export const config = defineConfig([...core, ...react, eslintConfigPrettier]);

export { typeAware } from "./base.js";
