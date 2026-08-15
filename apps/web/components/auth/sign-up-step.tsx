"use client";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { SignUpForm } from "@/components/auth/sign-up-form";

/**
 * Client wiring + guard for `/auth/sign-up`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Renders
 * nothing while redirecting.
 */
export function SignUpStep() {
  const email = useRequiredEmail();
  if (!email) {
    return null;
  }

  return (
    <>
      <AuthHeader
        title="Create your account"
        description="Choose a password to finish setting up your efferd account."
      />
      {/* `onSubmit` (the sign-up call) is injected here during wiring (ADR 0025). */}
      <SignUpForm email={email} />
    </>
  );
}
