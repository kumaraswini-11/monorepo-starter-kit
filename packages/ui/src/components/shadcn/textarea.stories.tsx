import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "@workspace/ui/components/shadcn/textarea";

const meta = {
  title: "shadcn/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "Type your message here.", "aria-label": "Message" },
  argTypes: { disabled: { control: "boolean" } },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default textarea (auto-sizes to its content via `field-sizing`). */
export const Default: Story = {};

/** Disabled state. */
export const Disabled: Story = { args: { disabled: true } };

/** Invalid state. */
export const Invalid: Story = { args: { "aria-invalid": true } };
