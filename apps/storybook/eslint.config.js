import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/react-internal";

export default defineConfig([
  // Flat config ignores only node_modules and .git by default; the un-ignore is kept so the
  // Storybook config directory is explicitly in scope if a default ignore ever covers dotdirs.
  globalIgnores(["!.storybook/"]),
  ...config,
  ...storybook.configs["flat/recommended"],
  typeAware(import.meta.dirname),
]);
