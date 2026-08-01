import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Kbd, KbdGroup } from "@workspace/ui/components/shadcn/kbd";

const meta = {
  title: "shadcn/Kbd",
  component: Kbd,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Esc" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single key. */
export const Default: Story = {};

/** A group of keys forming a shortcut. */
export const Group: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};
