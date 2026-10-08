import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([...config, typeAware(import.meta.dirname)]);
