import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { core } from "./base.js";
import { react } from "./react-internal.js";

/**
 * Config for Next.js applications: core + React (which includes jsx-a11y, ADR 0020) + the
 * Next plugin's recommended and Core-Web-Vitals rule sets. Prettier last (ADR 0004).
 */
export const nextJsConfig = defineConfig([
  ...core,
  ...react,
  pluginNext.configs.recommended,
  pluginNext.configs["core-web-vitals"],
  { languageOptions: { globals: { ...globals.serviceworker } } },
  eslintConfigPrettier,
]);

export { typeAware } from "./base.js";
