import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@workspace/ui/components/shadcn/input";
import { Label } from "@workspace/ui/components/shadcn/label";

const meta = {
  title: "shadcn/Label",
  component: Label,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Email" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A standalone label. */
export const Default: Story = {};

/** Paired with an input via `htmlFor` — clicking the label focuses the field. */
export const WithInput: Story = {
  render: (args) => (
    <div className="grid w-full max-w-xs gap-2">
      <Label {...args} htmlFor="label-demo-email" />
      <Input id="label-demo-email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
