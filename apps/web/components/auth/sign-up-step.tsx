"use client";

import { useRouter } from "next/navigation";

import { brand } from "@workspace/ui/lib/brand";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthStepSkeleton } from "@/components/auth/auth-step-skeleton";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { signUpWithEmail } from "@/lib/auth/actions";

/**
 * Client wiring + guard for `/auth/sign-up`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Shows a
 * skeleton while redirecting. Better Auth auto-signs-in on sign-up, so on success →
 * `/dashboard`; a failure surfaces via `FormError` (ADR 0025 §2 / 0027).
 */
export function SignUpStep() {
  const router = useRouter();
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
      <SignUpForm
        email={email}
        onSubmit={async ({ password, name }) => {
          await signUpWithEmail({ email, password, name });
          router.push("/dashboard");
          // Sync server components with the just-created (auto-signed-in) session.
          router.refresh();
        }}
      />
    </>
  );
}
