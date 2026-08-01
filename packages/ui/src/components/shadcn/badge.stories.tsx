import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@workspace/ui/components/shadcn/badge";

type BadgeProps = ComponentProps<typeof Badge>;

// CVA can't expose its variant keys at runtime; `satisfies` ties this list to
// Badge's own prop types, so a renamed/removed variant fails typecheck instead
// of silently drifting.
const VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const satisfies readonly NonNullable<BadgeProps["variant"]>[];

const meta = {
  title: "shadcn/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Badge" },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style.",
      table: { defaultValue: { summary: "default" } },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default badge — use the Controls panel to try any variant. */
export const Default: Story = {};

/** Every visual variant at a glance. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};
