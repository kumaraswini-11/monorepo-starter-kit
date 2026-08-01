import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "@workspace/ui/components/shadcn/skeleton";

const meta = {
  title: "shadcn/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single placeholder block. */
export const Default: Story = {
  render: () => <Skeleton className="h-4 w-48" />,
};

/** A typical loading placeholder — avatar + two lines of text. */
export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  ),
};
