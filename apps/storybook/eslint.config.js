import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/react-internal";

export default defineConfig([
  // ESLint skips dot-directories by default; the Storybook config lives in one.
  globalIgnores(["!.storybook/"]),
  ...config,
  ...storybook.configs["flat/recommended"],
  typeAware(import.meta.dirname),
]);
