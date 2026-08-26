import { config } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
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
];
