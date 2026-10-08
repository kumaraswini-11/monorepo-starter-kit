"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { toast } from "@workspace/ui/components/shadcn/toast";

/**
 * Surfaces a failed OAuth round-trip. Better Auth sends the browser back to `errorCallbackURL`
 * with `?error=<code>` (its callback route's `redirectOnError`); without this the user lands on
 * the chooser with no feedback. One generic message for every code — the codes include
 * account-state hints, and the auth UI never reveals those (ADR 0017). Renders nothing; mount
 * under `<Suspense>` because `useSearchParams` would otherwise de-opt the static shell.
 */
export function OAuthErrorToast() {
  const router = useRouter();
  const error = useSearchParams().get("error");
  // Guards React's dev-only double effect run so the toast is shown once.
  const shownRef = useRef(false);

  useEffect(() => {
    if (!error || shownRef.current) return;
    shownRef.current = true;
    toast.add({
      title: "Sign-in didn't complete",
      description:
        "The provider didn't finish signing you in. Please try again, or continue with your email.",
      type: "error",
      // Errors persist until dismissed (better-accessibility) and announce assertively.
      timeout: 0,
      priority: "high",
    });
    // Drop the query so a refresh or back-navigation doesn't re-announce it.
    router.replace("/auth");
  }, [error, router]);

  return null;
}
