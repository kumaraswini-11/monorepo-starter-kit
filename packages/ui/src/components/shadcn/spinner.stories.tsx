import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Spinner } from "@workspace/ui/components/shadcn/spinner";

const meta = {
  title: "shadcn/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default spinner (`role="status"`, labelled "Loading"). */
export const Default: Story = {};

/** A few sizes, set via the `size-*` utility. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};
