import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Button } from "@workspace/ui/components/shadcn/button";

type ButtonProps = ComponentProps<typeof Button>;

// CVA can't expose its variant keys at runtime, so these lists are unavoidable —
// but `satisfies` ties them to Button's own prop types, so a renamed or removed
// variant/size fails typecheck instead of silently drifting.
const VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const satisfies readonly NonNullable<ButtonProps["variant"]>[];

const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const satisfies readonly NonNullable<ButtonProps["size"]>[];

const meta = {
  title: "shadcn/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  // Default props for every story. `onClick: fn()` logs clicks in the Actions
  // panel and makes the handler assertable in interaction tests.
  args: { children: "Button", onClick: fn() },
  // CVA's `VariantProps` can't be auto-inferred into option lists, so declare the
  // controls explicitly — this turns `variant`/`size` into dropdowns and enriches
  // the autodocs.
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style.",
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      control: "select",
      options: SIZES,
      description: "Sizing preset (`icon-*` are for icon-only buttons).",
      table: { defaultValue: { summary: "default" } },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default button — use the Controls panel to try any variant × size. */
export const Default: Story = {};

/** Every visual variant at a glance. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/** The text sizes side by side (`icon-*` sizes are for icon-only buttons). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};
