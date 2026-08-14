"use client";

import { useEffect } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";

/**
 * Segment error boundary for uncaught render errors (Next 16 — note the prop is
 * `unstable_retry`, which replaced `reset`). Must be a Client Component.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
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
      <Button onClick={() => unstable_retry()}>Try again</Button>
    </main>
  );
}
