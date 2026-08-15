"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { PasswordForm } from "@/components/auth/password-form";

/**
 * Client wiring + guard for the password step. The email lives only in the in-memory
 * auth-flow state (ADR 0025 §4), so a refresh / bookmark / direct navigation arrives with
 * no email — restart the flow at the email step (`replace`, so the dead URL isn't kept in
 * history). Renders nothing while redirecting, to avoid a flash of the form.
 *
 * The header + form are mode-aware (sign-in vs sign-up). Until the email step's existence
 * check is wired, `onSwitchMode` lets the user flip modes so both are reviewable.
 */
export function PasswordStep() {
  const router = useRouter();
  const { email, mode, setMode } = useAuthFlow();

  useEffect(() => {
    if (!email) {
      router.replace("/auth/email");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  const isSignUp = mode === "sign-up";

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
      {/*
       * `onSubmit` (the actual sign-in / sign-up call) is injected here during the wiring
       * phase (ADR 0025); the form is UI-only until then.
       */}
      <PasswordForm
        email={email}
        mode={mode}
        onSwitchMode={() => setMode(isSignUp ? "sign-in" : "sign-up")}
      />
    </>
  );
}
