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
    // This package IS the design system (ADR 0016, 0038). Its components — vendored primitives
    // and our molecules alike — compose and restyle primitives by definition (a molecule's
    // `size="sm"` legitimately tightens an `Empty`'s spacing), so the consumer-facing usage
    // rules do not apply to component source. Token discipline still does: no raw palette
    // colors, no arbitrary values, no inline styles in our own molecules.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "shadcn/no-restyle": "off",
      "shadcn/require-static-classes": "off",
    },
  },
  {
    // shadcn/ui primitives are vendored into this package as-is (ADR 0005, ADR 0030): we
    // re-apply documented deviations on every upstream update, so every lint-driven edit to
    // this directory is a maintenance tax with no safety gain. Scope: ONLY the vendored tree
    // (`components/shadcn/**` + the vendored `use-mobile` hook); our own molecules keep the
    // full gate. Rules relaxed here fall into three groups:
    //  - React 19 idiom / style preferences upstream has not adopted yet (`use()` over
    //    `useContext`, `<Context>` over `.Provider`, setter naming, index keys in static
    //    lists, render-prop component definitions, CSS-variable `dangerouslySetInnerHTML` in
    //    chart.tsx) and the known sync-from-external-system effects (carousel, use-mobile).
    //  - `any`-typed data flowing out of third-party chart/calendar APIs (recharts,
    //    react-day-picker), which the type-aware `no-unsafe-*` rules flag inside upstream code.
    //  - Design-system usage rules that primitives cannot satisfy by construction: upstream
    //    uses arbitrary Tailwind values (`grid-rows-[auto_1fr]`), chart.tsx injects CSS
    //    variables via `<style>`/inline style, and a few upstream classes generate no CSS
    //    (`cn-input-otp`, drawer `origin-start/end`) — known, harmless, re-checked on updates.
    // Correctness rules (hooks deps, purity, missing keys on dynamic lists, raw palette colors)
    // stay on; jsx-a11y is scoped out of this tree by the shared config (primitives trip rules
    // written for application markup) and applies in full to our own molecules.
    files: ["src/components/shadcn/**/*.{ts,tsx}", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
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
      "shadcn/no-arbitrary-values": "off",
      "shadcn/no-inline-styles": "off",
      "shadcn/no-unknown-classes": "off",
    },
  },
]);
