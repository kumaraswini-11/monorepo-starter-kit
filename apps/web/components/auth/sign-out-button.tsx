"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={pending} onClick={onSignOut}>
      {pending ? <Spinner /> : null}
      Sign out
    </Button>
  );
}
