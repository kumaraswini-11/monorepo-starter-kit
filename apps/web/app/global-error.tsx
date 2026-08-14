"use client";

import { useEffect } from "react";

import "@workspace/ui/globals.css";

/**
 * Catches errors thrown by the root layout itself. It *replaces* the root layout
 * when active, so it must render its own `<html>`/`<body>` and can't rely on the
 * app's providers (theme, fonts). Kept deliberately minimal. Must be a Client
 * Component (Next 16 — prop is `unstable_retry`, not `reset`).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // TODO(deploy): report critical root-layout errors to a monitoring service.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center font-sans text-foreground antialiased">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          A critical error occurred while loading the app. Please try again.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
