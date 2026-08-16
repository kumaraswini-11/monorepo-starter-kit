import type { Metadata } from "next";

import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthHeader } from "@/components/auth/auth-header";
import { EmailStep } from "@/components/auth/email-step";

export const metadata: Metadata = { title: "Continue with email" };

/**
 * Email capture — step 2 of the method-first flow, at `/auth/email`. Server Component so
 * the back link and header stay in the static shell (ADR 0023); only `EmailCaptureForm`
 * ships client JS. Shared `AuthHeader` keeps the scale identical to the entry screen.
 */
export default function EmailCapturePage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth" />

      {/* Deliberately neutral description: naming the account-exists branch that follows
          would telegraph whether the address is registered (enumeration — spec §1). */}
      <AuthHeader
        title="What's your work email?"
        description="We'll take you to the right next step."
      />

      <EmailStep />
    </div>
  );
}
