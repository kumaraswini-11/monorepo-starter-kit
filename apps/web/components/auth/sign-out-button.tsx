"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";
import { toast } from "@workspace/ui/components/shadcn/toast";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      // Better Auth resolves with `{ error }` rather than throwing on an API failure —
      // only navigate away once we know the session was actually cleared, so a failed
      // sign-out never leaves an active session behind an auth screen.
      const { error } = await authClient.signOut();
      if (error) {
        toast.add({
          title: "Couldn't sign you out",
          description: error.message ?? "Please try again.",
          type: "error",
        });
        return;
      }
      router.push("/auth");
      router.refresh();
    } catch {
      // Network / unexpected rejection.
      toast.add({
        title: "Couldn't sign you out",
        description: "Please try again.",
        type: "error",
      });
    } finally {
      // Always re-enable — on success the dashboard unmounts, so this is a no-op there.
      setPending(false);
    }
  }

  return (
    <Button variant="outline" disabled={pending} onClick={onSignOut}>
      {pending ? <Spinner /> : null}
      Sign out
    </Button>
  );
}
