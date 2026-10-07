import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { core } from "./base.js";
import { react } from "./react-internal.js";

/**
 * Config for Next.js applications: core + React + the Next plugin's recommended and
 * Core-Web-Vitals rule sets + jsx-a11y (the app owns accessibility, ADR 0020; vendored
 * primitives in packages/ui already handle their own). Prettier last (ADR 0004).
 */
export const nextJsConfig = defineConfig([
  ...core,
  ...react,
  pluginNext.configs.recommended,
  pluginNext.configs["core-web-vitals"],
  jsxA11y.flatConfigs.recommended,
  { languageOptions: { globals: { ...globals.serviceworker } } },
  eslintConfigPrettier,
]);

export { typeAware } from "./base.js";
