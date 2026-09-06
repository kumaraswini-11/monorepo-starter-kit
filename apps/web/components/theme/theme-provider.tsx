"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      // Mod+Shift+L (⌘⇧L on macOS, Ctrl+Shift+L elsewhere) — a modifier-based chord, never a
      // bare key, to satisfy WCAG 2.1.4 and match the sidebar's ⌘B grammar; ⇧ dodges ⌘L (the
      // browser address bar). Quick light↔dark flip; the header menu covers System (ADR 0023).
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || !event.shiftKey || event.altKey) {
        return;
      }

      // `event.key` can be undefined for synthetic/autofill/IME keydowns, so guard.
      if (event.key?.toLowerCase() !== "l") {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  return null;
}

export { ThemeProvider };
