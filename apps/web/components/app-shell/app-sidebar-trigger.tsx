"use client";

import {
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/shadcn/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/shadcn/tooltip";

/**
 * The header sidebar toggle with a visible, state-aware tooltip. shadcn's `SidebarTrigger` ships
 * only an `sr-only` "Toggle Sidebar" label; this adds a pointer-user hint that names the action in
 * its current state ("Expand"/"Collapse"). The ⌘B chord is owned by `SidebarProvider` — we don't
 * restate it here to avoid a second shortcut hint that could drift from the source of truth.
 */
export function AppSidebarTrigger() {
  const { state } = useSidebar();
  const label = state === "expanded" ? "Close sidebar" : "Open sidebar";

  return (
    <Tooltip>
      <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
      <TooltipContent side="inline-end">{label}</TooltipContent>
    </Tooltip>
  );
}
