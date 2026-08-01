import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/shadcn/progress";

const meta = {
  title: "shadcn/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: 60 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A determinate progress bar — drag the `value` control to update it. */
export const Default: Story = {
  args: { "aria-label": "Upload progress" },
};

/** With a label and a live percentage value (which name the bar for a11y). */
export const WithLabel: Story = {
  args: { value: 40 },
  render: (args) => (
    <Progress {...args}>
      <ProgressLabel>Uploading…</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
