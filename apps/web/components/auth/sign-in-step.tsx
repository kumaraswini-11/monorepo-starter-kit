"use client";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthStepSkeleton } from "@/components/auth/auth-step-skeleton";
import { SignInForm } from "@/components/auth/sign-in-form";

/**
 * Client wiring + guard for `/auth/sign-in`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Shows a
 * skeleton while redirecting.
 */
export function SignInStep() {
  const email = useRequiredEmail();
  if (!email) {
    return <AuthStepSkeleton />;
  }

  return (
    <>
      <AuthHeader
        title="Enter your password"
        description="Use the password for this account."
      />
      {/* Wiring: inject `onSubmit` here; throw a user-safe Error to surface it (ADR 0025 §2). */}
      <SignInForm email={email} />
    </>
  );
}
