import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthBackLink } from "@/components/auth/auth-back-link";
import { PasswordStep } from "@/components/auth/password-step";

export const metadata: Metadata = { title: "Continue" };

/**
 * Credential step at `/auth/password` — sign-in or sign-up depending on the flow's mode
 * (identifier-first: decided from the email, not chosen here). Server Component shell
 * (ADR 0023): the back link is static; `PasswordStep` renders the mode-aware header +
 * form as a client island. Reached only via `/auth/email` (it needs the captured email);
 * arriving without one restarts at the email step.
 */
export default function PasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth/email" />
      {/* `PasswordStep` reads searchParams (the dev-preview mode), so it sits behind a
          Suspense boundary to keep the shell statically prerendered (ADR 0023). */}
      <Suspense fallback={null}>
        <PasswordStep />
      </Suspense>
    </div>
  );
}
