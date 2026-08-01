import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { Checkbox } from "@workspace/ui/components/shadcn/checkbox";

const meta = {
  title: "shadcn/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  // `aria-label` gives the control an accessible name (keeps a11y checks clean).
  args: { onCheckedChange: fn(), "aria-label": "Subscribe to updates" },
  argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default (unchecked) checkbox. */
export const Default: Story = {};

/** Checked by default. */
export const Checked: Story = { args: { defaultChecked: true } };

/** Disabled state. */
export const Disabled: Story = { args: { disabled: true } };

/** Interaction test: clicking toggles the checkbox and fires `onCheckedChange`. */
export const Toggles: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalled();
  },
};
