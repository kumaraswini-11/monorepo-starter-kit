import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/shadcn/card";

type CardProps = ComponentProps<typeof Card>;

const SIZES = ["default", "sm"] as const satisfies readonly NonNullable<
  CardProps["size"]
>[];

const meta = {
  title: "shadcn/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      table: { defaultValue: { summary: "default" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A full card: header (title + description + action), content, and footer. */
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Give your project a name and pick a framework to get started.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button size="sm">Deploy</Button>
      </CardFooter>
    </Card>
  ),
};
