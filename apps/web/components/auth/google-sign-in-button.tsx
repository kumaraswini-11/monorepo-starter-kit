"use client";

import { useState } from "react";

import { GoogleIcon } from "@workspace/ui/components/icons/google-icon";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";
import { toast } from "@workspace/ui/components/shadcn/toast";

import { signInWithGoogle } from "@/lib/auth/actions";

/**
 * "Continue with Google" — a client island on the otherwise-static `/auth` page (ADR 0019/0025),
 * so the page still prerenders. Kicks off the OAuth redirect through the seam; a successful start
 * navigates away to Google, and a pre-redirect failure surfaces a toast and re-enables the button.
 */
export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      // Redirects to Google on success (the component unmounts as the browser navigates away).
      await signInWithGoogle();
    } catch {
      toast.add({
        title: "Couldn't start Google sign-in",
        description: "Please try again, or continue with your email.",
        type: "error",
        priority: "high",
      });
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={onClick}
    >
      {pending ? <Spinner /> : <GoogleIcon data-icon="inline-start" />}
      <span className="min-w-38 text-start">Continue with Google</span>
    </Button>
  );
}
