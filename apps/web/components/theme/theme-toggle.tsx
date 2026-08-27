"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn/dropdown-menu";

import { ThemeRadioGroup } from "@/components/theme/theme-radio-group";

/**
 * Standalone theme control (Light / Dark / System) for the **public** `(auth)` pages, which have
 * no account menu to nest it in. The authed shell nests the same control inside the account menu
 * (see `UserMenu`); both render the shared `ThemeRadioGroup`, and both share the ⌘⇧L quick-flip
 * and the ⌘K palette (ADR 0023). The trigger icon reflects the resolved theme via the `.dark`
 * class (no hydration mismatch).
 */
export function ThemeToggle() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Theme"
            aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
          >
            <SunIcon className="hidden dark:block" aria-hidden="true" />
            <MoonIcon className="block dark:hidden" aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        <ThemeRadioGroup />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
