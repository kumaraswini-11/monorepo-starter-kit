"use client";

import { brand } from "@workspace/ui/lib/brand";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthStepSkeleton } from "@/components/auth/auth-step-skeleton";
import { SignUpForm } from "@/components/auth/sign-up-form";

/**
 * Client wiring + guard for `/auth/sign-up`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Shows a
 * skeleton while redirecting.
 */
export function SignUpStep() {
  const email = useRequiredEmail();
  if (!email) {
    return <AuthStepSkeleton />;
  }

  return (
    <>
      <AuthHeader
        title="Create your account"
        description={`Choose a password to finish setting up your ${brand.name} account.`}
      />
      {/* Wiring: inject `onSubmit` here; throw a user-safe Error to surface it (ADR 0025 §2). */}
      <SignUpForm email={email} />
    </>
  );
}
