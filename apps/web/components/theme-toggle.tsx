"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@workspace/ui/components/shadcn/button";

/**
 * Visible, pointer-accessible theme toggle. The `d` hotkey (theme-provider) is an
 * enhancement, not the only way to switch — mouse/touch users need a real control
 * (WCAG 2.1.1 / 2.1.4). Icons swap via the `.dark` class (CSS), so there's no
 * hydration mismatch and no mount-guard state; `resolvedTheme` is only read inside the
 * click handler, which never runs before hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden dark:block" aria-hidden="true" />
      <MoonIcon className="block dark:hidden" aria-hidden="true" />
    </Button>
  );
}
