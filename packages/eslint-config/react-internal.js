import eslintReact from "@eslint-react/eslint-plugin";
import { plugin as shadcn } from "@shadcn/lint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { core } from "./base.js";

/**
 * React rules shared by React libraries (packages/ui) and the Next.js app. Exported WITHOUT
 * the Prettier override so `next.js` can layer on top; `config` below appends it.
 *
 * - `@eslint-react` replaces `eslint-plugin-react` (no ESLint 10 support upstream — ADR 0033);
 *   its TypeScript preset drops the prop-types / JSX-scope rules the automatic JSX runtime
 *   makes redundant.
 * - `eslint-plugin-react-hooks` 7 ships the React Compiler rules in `flat.recommended`; it is
 *   the single owner of those rules — `@eslint-react`'s ports of the same nine rules are turned
 *   off below so a violation is reported (and suppressed) exactly once.
 * - `eslint-plugin-jsx-a11y` runs on every React file we author — the app and the design
 *   system's own molecules (ADR 0020, 0021 amended). The vendored shadcn tree is exempt: it is
 *   upstream code re-applied on every update (ADR 0005, 0030) and primitives such as a bare
 *   `<Label>` or `<PaginationLink>` wrapper trip rules written for application markup.
 * - `@shadcn/lint` enforces design-system USAGE (ADR 0038): consumers style through a
 *   component's variants/sizes, not `className` overrides; colors and values come from the
 *   theme. It reads `components.json`, each component's `cva` variants and the `@theme`
 *   tokens, so its errors tell an agent exactly which variant/size/token to use instead.
 */

/**
 * Design-system usage policy (`shadcn/no-restyle`, ADR 0038). The ownership model: a
 * component owns its IDENTITY (color, shape, typography, its own padding and icon gap); the
 * consumer owns PLACEMENT (margin, width, flex position) and COMPOSITION (what goes inside a
 * container part and how those children are arranged). The linter classifies classes, not
 * relationships, so this object encodes the model:
 * - `layout` = placement, always allowed. `tabular-nums` is numeric formatting, never a
 *   restyle, so it is allowed everywhere.
 * - Container PARTS whose children the consumer composes (a card title holding a badge, a
 *   menu label holding an avatar + text) may arrange them with `gap-*`: composition.
 * - Overlay/menu CONTENT containers host arbitrary children, so they may control their own
 *   spacing (e.g. `p-0` on a PopoverContent that renders a list with its own padding).
 * - Round icon triggers (avatar, notification bell) are a recurring app-shell shape that no
 *   Button variant models; `rounded-full` is allowed on Buttons only. Trigger: a third round
 *   trigger means the Button needs a shape variant — change the component, drop the contract.
 * Identity changes are NEVER a contract: use a variant, give the component the capability,
 * or accept the default. A wrapper element added only to dodge the rule is not a fix.
 */
// A contract REPLACES the global allow list for its components (it does not merge), so every
// contract spreads the base placement/formatting allowances first.
const placement = ["layout", "tabular-nums"];

export const designSystemPolicy = {
  allow: placement,
  contracts: [
    {
      pattern:
        "^(Card(Header|Title|Description|Content|Footer)|DropdownMenuLabel|Dialog(Header|Footer)|Sheet(Header|Footer)|Alert(Title|Description))$",
      allow: [...placement, "gap-*"],
    },
    {
      pattern: "^(Popover|DropdownMenu|HoverCard|Sheet|Dialog|Drawer)Content$",
      allow: [...placement, "spacing"],
    },
    { pattern: "^Button$", allow: [...placement, "rounded-full"] },
  ],
};

export const react = [
  eslintReact.configs["recommended-typescript"],
  reactHooks.configs.flat.recommended,
  {
    // Duplicates of eslint-plugin-react-hooks 7 rules (same checks, different severities).
    rules: {
      "@eslint-react/rules-of-hooks": "off",
      "@eslint-react/exhaustive-deps": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/set-state-in-render": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/static-components": "off",
      "@eslint-react/use-memo": "off",
      "@eslint-react/error-boundaries": "off",
      "@eslint-react/unsupported-syntax": "off",
    },
  },
  { ...jsxA11y.flatConfigs.recommended, ignores: ["**/components/shadcn/**"] },
  { languageOptions: { globals: { ...globals.browser } } },
  {
    plugins: { shadcn },
    // The design system's canonical import path; `components.json` (apps/web, packages/ui)
    // points at the same alias. Import resolution follows workspace `exports`.
    settings: { shadcn: { ui: "@workspace/ui/components/shadcn" } },
    rules: {
      "shadcn/no-restyle": ["error", designSystemPolicy],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/require-static-classes": "error",
    },
  },
];

/** Config for React libraries. Prettier last (ADR 0004). */
export const config = defineConfig([...core, ...react, eslintConfigPrettier]);

export { typeAware } from "./base.js";
