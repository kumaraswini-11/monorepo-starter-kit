import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/shadcn/alert";

type AlertProps = ComponentProps<typeof Alert>;

const VARIANTS = [
  "default",
  "destructive",
] as const satisfies readonly NonNullable<AlertProps["variant"]>[];

const meta = {
  title: "shadcn/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style.",
      table: { defaultValue: { summary: "default" } },
    },
  },
  // Alert is full-width; constrain it so stories read like a real callout.
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Title + description with a leading icon (the grid adapts when an icon is present). */
export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <CircleCheckIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Changes you make are saved automatically.
      </AlertDescription>
    </Alert>
  ),
};

/** The destructive variant, for errors and warnings. */
export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <TriangleAlertIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        Your changes could not be saved. Please try again.
      </AlertDescription>
    </Alert>
  ),
};
