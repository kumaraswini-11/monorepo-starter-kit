"use client";

import { useEffect } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";

/**
 * Error boundary scoped to the authenticated segment. Because it renders inside the `(app)`
 * layout, the shell survives — the sidebar, header, and account menu (sign-out) stay put, so
 * a content failure never strands the user without navigation. Only the content pane shows the
 * error. Renders a `<div>`, not `<main>`: `SidebarInset` already owns the page's single
 * `<main>` (ADR 0020).
 *
 * `retry` re-renders the segment — stable in Next 16.3 (it supersedes the earlier
 * `unstable_retry` name). Must be a Client Component.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // TODO(deploy): forward to an error-monitoring service (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Please try again — and if it keeps happening, contact support.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
