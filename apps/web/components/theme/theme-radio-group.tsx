"use client";

import { useTheme } from "next-themes";

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@workspace/ui/components/shadcn/dropdown-menu";

import { THEME_OPTIONS } from "@/components/theme/theme-options";

/**
 * The shared Light / Dark / System radio group (three-state, ADR 0023) — used by both the account
 * menu (as a submenu) and the public-pages `ThemeToggle`. `menuitemradio` announces the active
 * choice; `next-themes`' `theme` holds the setting (light|dark|system).
 */
export function ThemeRadioGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
      {THEME_OPTIONS.map((option) => (
        <DropdownMenuRadioItem key={option.value} value={option.value}>
          <option.icon aria-hidden="true" />
          {option.label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
