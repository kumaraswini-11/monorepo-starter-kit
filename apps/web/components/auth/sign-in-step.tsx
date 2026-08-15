"use client";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { SignInForm } from "@/components/auth/sign-in-form";

/**
 * Client wiring + guard for `/auth/sign-in`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Renders
 * nothing while redirecting.
 */
export function SignInStep() {
  const email = useRequiredEmail();
  if (!email) {
    return null;
  }

  return (
    <>
      <AuthHeader
        title="Enter your password"
        description="Enter the password for your account to continue."
      />
      {/* `onSubmit` (the sign-in call) is injected here during wiring (ADR 0025). */}
      <SignInForm email={email} />
    </>
  );
}
