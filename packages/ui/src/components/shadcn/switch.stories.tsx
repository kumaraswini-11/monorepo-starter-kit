import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { Switch } from "@workspace/ui/components/shadcn/switch";

type SwitchProps = ComponentProps<typeof Switch>;

const SIZES = ["sm", "default"] as const satisfies readonly NonNullable<
  SwitchProps["size"]
>[];

const meta = {
  title: "shadcn/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onCheckedChange: fn(), "aria-label": "Airplane mode" },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      table: { defaultValue: { summary: "default" } },
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default (off) switch. */
export const Default: Story = {};

/** On by default. */
export const Checked: Story = { args: { defaultChecked: true } };

/** Disabled state. */
export const Disabled: Story = { args: { disabled: true } };

/** Both sizes side by side. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {SIZES.map((size) => (
        <Switch key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/** Interaction test: clicking toggles the switch and fires `onCheckedChange`. */
export const Toggles: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const control = canvas.getByRole("switch");
    await expect(control).not.toBeChecked();
    await userEvent.click(control);
    await expect(control).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalled();
  },
};
