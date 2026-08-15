import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthBackLink } from "@/components/auth/auth-back-link";
import { ResetPasswordStep } from "@/components/auth/reset-password-step";

export const metadata: Metadata = { title: "Set a new password" };

/**
 * Reset-password at `/auth/reset-password?token=…` (the email link target). Server
 * Component shell (ADR 0023): the back link is static; `ResetPasswordStep` reads the token
 * from the URL, so it sits behind a Suspense boundary to keep the shell prerendered.
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth/sign-in" />
      <Suspense fallback={null}>
        <ResetPasswordStep />
      </Suspense>
    </div>
  );
}
