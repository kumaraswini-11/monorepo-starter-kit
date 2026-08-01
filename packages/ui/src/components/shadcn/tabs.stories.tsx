import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/shadcn/tabs";

const meta = {
  title: "shadcn/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Panels = () => (
  <Tabs defaultValue="account">
    <TabsList>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
    </TabsList>
    <TabsContent value="account">Manage your account details here.</TabsContent>
    <TabsContent value="password">Change your password here.</TabsContent>
  </Tabs>
);

/** A two-tab panel. */
export const Default: Story = { render: () => <Panels /> };

/** Interaction test: clicking a tab switches the visible panel. */
export const SwitchesTabs: Story = {
  render: () => <Panels />,
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByText("Manage your account details here.")
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "Password" }));
    await expect(canvas.getByText("Change your password here.")).toBeVisible();
  },
};
