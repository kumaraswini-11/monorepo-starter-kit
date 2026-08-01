import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Separator } from "@workspace/ui/components/shadcn/separator";

type SeparatorProps = ComponentProps<typeof Separator>;

const ORIENTATIONS = [
  "horizontal",
  "vertical",
] as const satisfies readonly NonNullable<SeparatorProps["orientation"]>[];

const meta = {
  title: "shadcn/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ORIENTATIONS,
      table: { defaultValue: { summary: "horizontal" } },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal rule between stacked content. */
export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64 text-sm">
      <p>Above the divider.</p>
      <Separator {...args} className="my-3" />
      <p>Below the divider.</p>
    </div>
  ),
};

/** A vertical rule between inline items. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Docs</span>
      <Separator {...args} />
      <span>Guides</span>
      <Separator {...args} />
      <span>API</span>
    </div>
  ),
};
