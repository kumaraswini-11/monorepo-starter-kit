import type { Metadata } from "next";

import { AuthBackLink, SignUpStep } from "@/features/auth";

export const metadata: Metadata = { title: "Create account" };

/**
 * Sign-up credential step at `/auth/sign-up` (identifier-first: the email step routes new
 * accounts here). Server Component shell (ADR 0019): the back link is static; `SignUpStep`
 * renders the header + form as a client island guarded on the captured email.
 */
export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth/email" />
      <SignUpStep />
    </div>
  );
}
