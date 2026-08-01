import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { Label } from "@workspace/ui/components/shadcn/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/shadcn/radio-group";

const meta = {
  title: "shadcn/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onValueChange: fn() },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  { value: "spacious", label: "Spacious" },
] as const;

const Group = (args: ComponentProps<typeof RadioGroup>) => (
  <RadioGroup {...args} defaultValue="comfortable">
    {OPTIONS.map(({ value, label }) => (
      <div key={value} className="flex items-center gap-2">
        <RadioGroupItem value={value} id={`rg-${value}`} />
        <Label htmlFor={`rg-${value}`}>{label}</Label>
      </div>
    ))}
  </RadioGroup>
);

/** A single-select group with labelled options. */
export const Default: Story = { render: (args) => <Group {...args} /> };

/** Interaction test: selecting an option checks it and fires `onValueChange`. */
export const SelectsOption: Story = {
  render: (args) => <Group {...args} />,
  play: async ({ canvas, userEvent, args }) => {
    const spacious = canvas.getByRole("radio", { name: "Spacious" });
    await expect(spacious).not.toBeChecked();
    await userEvent.click(spacious);
    await expect(spacious).toBeChecked();
    await expect(args.onValueChange).toHaveBeenCalled();
  },
};
