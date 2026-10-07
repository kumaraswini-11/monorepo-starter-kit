import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/base";

export default defineConfig([
  ...config,
  typeAware(import.meta.dirname),
  {
    // @workspace/utils is a leaf: pure, isomorphic, zero-dependency (ADR 0016). It must not
    // import any other internal package — that would invert the dependency direction.
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@workspace/*"],
              message:
                "@workspace/utils is a dependency-free leaf — it must not import other internal packages (ADR 0016).",
            },
          ],
        },
      ],
    },
  },
]);
