"use client";

import { useRouter } from "next/navigation";

import { toast } from "@workspace/ui/components/shadcn/toast";

import { signOut } from "@/lib/auth/actions";

/**
 * Sign out through the seam (`lib/auth/actions`), then land on `/auth`; on failure, toast and
 * stay put — a failed sign-out must never navigate away and strand a live session behind an auth
 * screen (ADR 0017). Shared by the account menu and the command palette so the behaviour and copy
 * stay identical. Resolves `true` on success (the caller has navigated away), `false` on a handled
 * failure (so a caller tracking a pending state can re-enable).
 */
export function useSignOut() {
  const router = useRouter();

  return async function runSignOut(): Promise<boolean> {
    try {
      await signOut();
      router.push("/auth");
      router.refresh();
      return true;
    } catch {
      toast.add({
        title: "Couldn't sign you out",
        description: "Please try again.",
        type: "error",
        // Errors persist until dismissed and announce assertively.
        timeout: 0,
        priority: "high",
      });
      return false;
    }
  };
}
