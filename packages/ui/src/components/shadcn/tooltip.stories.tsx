import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/shadcn/tooltip";

// Explicit annotation (not `satisfies`): Base UI's Tooltip type references
// internal modules that TS can't name in the exported declaration (TS2742).
const meta: Meta<typeof Tooltip> = {
  title: "shadcn/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  // Every tooltip must live inside a provider.
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover (or focus) the trigger to reveal the tooltip. */
export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
};

/** Shown open by default, for visual review of the popup. */
export const Open: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger render={<Button variant="outline">Trigger</Button>} />
      <TooltipContent>Always visible in this story</TooltipContent>
    </Tooltip>
  ),
};
