import type { Metadata } from "next";

import { AuthBackLink } from "@/components/auth/auth-back-link";
import { SignInStep } from "@/components/auth/sign-in-step";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Sign-in credential step at `/auth/sign-in` (identifier-first: the email step routes
 * existing accounts here). Server Component shell (ADR 0019): the back link is static;
 * `SignInStep` renders the header + form as a client island guarded on the captured email.
 */
export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth/email" />
      <SignInStep />
    </div>
  );
}
