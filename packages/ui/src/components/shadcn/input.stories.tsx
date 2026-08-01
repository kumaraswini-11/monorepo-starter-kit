import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Input } from "@workspace/ui/components/shadcn/input";

const meta = {
  title: "shadcn/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  // `aria-label` gives the control an accessible name (keeps a11y checks clean).
  args: { placeholder: "you@example.com", "aria-label": "Email" },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "file"],
      description: "Native input type.",
      table: { defaultValue: { summary: "text" } },
    },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default text input. */
export const Default: Story = {};

/** Disabled state. */
export const Disabled: Story = { args: { disabled: true } };

/** Invalid state — `aria-invalid` drives the destructive ring. */
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
};

/** Interaction test: typing updates the value. */
export const AcceptsTyping: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "hello@world.com");
    await expect(input).toHaveValue("hello@world.com");
  },
};
