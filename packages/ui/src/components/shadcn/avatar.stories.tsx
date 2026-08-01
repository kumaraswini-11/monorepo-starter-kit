import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/shadcn/avatar";

type AvatarProps = ComponentProps<typeof Avatar>;

const SIZES = ["sm", "default", "lg"] as const satisfies readonly NonNullable<
  AvatarProps["size"]
>[];

const meta = {
  title: "shadcn/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      table: { defaultValue: { summary: "default" } },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories feature the initials fallback (shown when no image is set or it fails
// to load) so they render deterministically without a network request.

/** Initials fallback. */
export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>KS</AvatarFallback>
    </Avatar>
  ),
};

/** All three sizes. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {SIZES.map((size) => (
        <Avatar key={size} {...args} size={size}>
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

/** A stacked group with an overflow count. */
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>EF</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
};
