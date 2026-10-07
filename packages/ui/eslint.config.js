import storybook from "eslint-plugin-storybook";
import { defineConfig } from "eslint/config";

import { config, typeAware } from "@workspace/eslint-config/react-internal";

export default defineConfig([
  ...config,
  // Stories are co-located here (ADR 0024); the Storybook rules (CSF validity, no
  // uninstalled addons, awaited play functions) apply to `*.stories.tsx`.
  ...storybook.configs["flat/recommended"],
  typeAware(import.meta.dirname),
  {
    // shadcn/ui primitives are vendored into this package as-is (ADR 0005, ADR 0030): we
    // re-apply documented deviations on every upstream update, so every lint-driven edit to
    // this directory is a maintenance tax with no safety gain. Scope: ONLY the vendored tree
    // (`components/shadcn/**` + the vendored `use-mobile` hook); our own molecules keep the
    // full gate. Rules relaxed here fall into two groups:
    //  - React 19 idiom / style preferences upstream has not adopted yet (`use()` over
    //    `useContext`, `<Context>` over `.Provider`, setter naming, index keys in static
    //    lists, render-prop component definitions, CSS-variable `dangerouslySetInnerHTML` in
    //    chart.tsx) and the known sync-from-external-system effects (carousel, use-mobile).
    //  - `any`-typed data flowing out of third-party chart/calendar APIs (recharts,
    //    react-day-picker), which the type-aware `no-unsafe-*` rules flag inside upstream code.
    // Correctness rules (hooks deps, purity, missing keys on dynamic lists, a11y) stay on.
    files: ["src/components/shadcn/**/*.{ts,tsx}", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/no-use-context": "off",
      "@eslint-react/no-context-provider": "off",
      "@eslint-react/use-state": "off",
      "@eslint-react/no-array-index-key": "off",
      "@eslint-react/no-nested-component-definitions": "off",
      "@eslint-react/dom-no-dangerously-set-innerhtml": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
]);
