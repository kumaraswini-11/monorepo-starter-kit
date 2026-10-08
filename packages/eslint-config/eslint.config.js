import { defineConfig } from "eslint/config";

import { config } from "./base.js";

// The config package lints its own JS with the base rules it exports (no TypeScript sources,
// so no `typeAware`). Without this file, ESLint 10's per-file config lookup finds nothing here
// and lint-staged fails on any staged change to these files.
export default defineConfig([...config]);
