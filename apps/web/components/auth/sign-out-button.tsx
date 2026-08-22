"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";
import { toast } from "@workspace/ui/components/shadcn/toast";

import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      // The seam only resolves once the session is actually cleared (it throws otherwise),
      // so we navigate away only on success — a failed sign-out never strands an active
      // session behind an auth screen.
      await signOut();
      router.push("/auth");
      router.refresh();
    } catch {
      toast.add({
        title: "Couldn't sign you out",
        description: "Please try again.",
        type: "error",
        // Errors persist until dismissed (better-accessibility) and announce assertively.
        timeout: 0,
        priority: "high",
      });
      // Re-enable only on failure; a successful sign-out unmounts this screen.
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
