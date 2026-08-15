"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import type { AuthMode } from "@/components/auth/auth-flow-provider";
import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { PasswordForm } from "@/components/auth/password-form";

/**
 * Client wiring + guard for the password step. The email lives only in the in-memory
 * auth-flow state (ADR 0025 §4), so a refresh / bookmark / direct navigation arrives with
 * no email — restart the flow at the email step (`replace`, so the dead URL isn't kept in
 * history). Renders nothing while redirecting, to avoid a flash of the form.
 *
 * Identifier-first: sign-in vs sign-up is decided from the email, NOT chosen by the user
 * (spec §2 — "branching happens server-side; UI only reacts"). The email step sets the
 * mode once the existence check is wired; to switch, the user changes the email (Back /
 * "Change"). Until wiring, a `?mode=sign-up` param previews the create path — a dev/review
 * aid only, never a user-facing toggle.
 */
export function PasswordStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email, mode } = useAuthFlow();

  useEffect(() => {
    if (!email) {
      router.replace("/auth/email");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  const previewMode = searchParams.get("mode");
  const resolvedMode: AuthMode =
    previewMode === "sign-up" || previewMode === "sign-in" ? previewMode : mode;
  const isSignUp = resolvedMode === "sign-up";

  return (
    <>
      <AuthHeader
        title={isSignUp ? "Create your account" : "Enter your password"}
        description={
          isSignUp
            ? "Choose a password to finish setting up your efferd account."
            : "Enter the password for your account to continue."
        }
      />
      {/* `onSubmit` (the sign-in / sign-up call) is injected here during wiring (ADR 0025). */}
      <PasswordForm email={email} mode={resolvedMode} />
    </>
  );
}
