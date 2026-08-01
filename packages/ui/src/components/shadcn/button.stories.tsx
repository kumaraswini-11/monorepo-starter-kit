import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@workspace/ui/components/shadcn/button";

/**
 * Sample co-located story validating the Storybook + Tailwind v4 + Base UI
 * pipeline. Real stories live next to their component (shadcn primitives here;
 * custom components at the `components/` top level).
 */
const meta = {
  title: "shadcn/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: "Button" } };
export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};
export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};
export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
