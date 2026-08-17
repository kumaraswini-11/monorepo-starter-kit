"use client";

import { useRouter } from "next/navigation";

import { useRequiredEmail } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthStepSkeleton } from "@/components/auth/auth-step-skeleton";
import { SignInForm } from "@/components/auth/sign-in-form";
import { signInWithEmail } from "@/lib/auth/actions";

/**
 * Client wiring + guard for `/auth/sign-in`. Requires the email captured at `/auth/email`;
 * a refresh / direct nav without one restarts the flow there (ADR 0025 §4). Shows a
 * skeleton while redirecting. On success → `/dashboard`; a failed sign-in surfaces via
 * `FormError` (the injected handler throws a `FormSubmitError`, ADR 0025 §2 / 0027).
 */
export function SignInStep() {
  const router = useRouter();
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
      <SignInForm
        email={email}
        onSubmit={async (password) => {
          await signInWithEmail(email, password);
          router.push("/dashboard");
          // Sync server components (the (app) guard, dashboard) with the new session —
          // Better Auth set the cookie client-side (matches sign-out's push + refresh).
          router.refresh();
        }}
      />
    </>
  );
}
