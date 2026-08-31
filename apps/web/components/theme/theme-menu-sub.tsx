"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@workspace/ui/components/shadcn/dropdown-menu";

import { THEME_OPTIONS } from "@/components/theme/theme-options";
import { ThemeRadioGroup } from "@/components/theme/theme-radio-group";

/**
 * The account-menu appearance submenu (ADR 0023). The trigger shows the current *setting* — Light /
 * Dark / System — inline (the settings-row pattern: macOS/iOS "Appearance  Light ›"), so the active
 * choice is legible without opening the submenu. The leading Sun/Moon tracks the *resolved* theme
 * and so can't tell System from Dark; the trailing label removes that ambiguity. Opening it reveals
 * the three-state radio group. Lives here rather than a standalone header toggle; the ⌘⇧L flip and
 * ⌘K palette change the theme too.
 */
export function ThemeMenuSub() {
  const { theme } = useTheme();

  // `theme` (the setting: light | dark | system) is undefined until next-themes hydrates — identical
  // on the server and the first client render, so the label starts empty and fills in with no
  // hydration mismatch (and it's always resolved by the time the menu is actually opened).
  const currentLabel = THEME_OPTIONS.find(
    (option) => option.value === theme
  )?.label;

  return (
    <DropdownMenuSub>
      {/* Zero the built-in chevron's own `ms-auto`: with two auto margins the free space splits
          and a gap opens between the value and the chevron. With only the value's `ms-auto`
          pushing, the value + chevron sit together at the trailing edge. */}
      <DropdownMenuSubTrigger className="[&>svg:last-child]:ms-0">
        <SunIcon className="dark:hidden" aria-hidden="true" />
        <MoonIcon className="hidden dark:block" aria-hidden="true" />
        Theme
        <span className="ms-auto text-xs text-muted-foreground">
          {currentLabel}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <ThemeRadioGroup />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
