"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOutIcon, SearchIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/shadcn/command";
import { Kbd } from "@workspace/ui/components/shadcn/kbd";

import { NAV_ITEMS } from "@/components/app-shell/nav";
import { THEME_OPTIONS } from "@/components/theme/theme-options";
import { useSignOut } from "@/lib/auth/use-sign-out";

/**
 * ⌘K command palette — the discoverable hub for shell actions (navigation, theme, sign-out), per
 * the keyboard-shortcut convention (ADR 0023). New actions belong here rather than minting more
 * global chords. Self-contained: renders its own header trigger and the dialog, and owns the
 * ⌘K / Ctrl+K toggle. `aria-keyshortcuts` exposes the chord to AT; the visible `Kbd` is
 * platform-aware (resolved after mount to avoid a hydration mismatch).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const runSignOut = useSignOut();

  // Platform label for the visible hint. Computed at render (guarded for SSR) rather than via
  // state-in-effect; server renders "Ctrl K" and the client corrects on Mac — `suppressHydrationWarning`
  // on the chip allows that one intentional difference.
  const isMac =
    typeof navigator !== "undefined" &&
    /mac|iphone|ipad/i.test(navigator.userAgent);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key?.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close first so the dialog isn't mid-transition when navigation/side effects run.
  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search</span>
        <Kbd className="hidden sm:inline-flex" suppressHydrationWarning>
          {isMac ? "⌘K" : "Ctrl K"}
        </Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {NAV_ITEMS.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              {THEME_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => run(() => setTheme(option.value))}
                >
                  <option.icon />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => run(() => void runSignOut())}>
                <LogOutIcon />
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
