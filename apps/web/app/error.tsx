"use client";

import { useEffect } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";

/**
 * Segment error boundary for uncaught render errors. `retry` re-renders the segment —
 * stable in Next 16.3 (it supersedes the earlier `unstable_retry` name). Must be a
 * Client Component.
 */
export default function Error({
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
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, and if it keeps
        happening, please contact support.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
