import { config } from "@workspace/eslint-config/react-internal";

/**
 * shadcn/ui primitives are vendored into this package as-is. A few of them
 * (e.g. carousel, use-mobile) intentionally sync from external systems inside
 * an effect — embla's API, `matchMedia` — which trips
 * `react-hooks/set-state-in-effect`. We relax that one rule for the vendored
 * source only; application code (apps/web) keeps the full hard gate.
 * See docs/decisions/0013-vendored-ui-lint-exception.md.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
