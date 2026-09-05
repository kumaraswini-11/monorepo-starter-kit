import type { Metadata } from "next";

import { AuthBackLink } from "@/components/auth/auth-back-link";
import { ForgotPasswordStep } from "@/components/auth/forgot-password-step";

export const metadata: Metadata = { title: "Reset your password" };

/**
 * Forgot-password request at `/auth/forgot-password` (reached from the sign-in "Forgot
 * password?" link). Server Component shell (ADR 0019): the back link is static;
 * `ForgotPasswordStep` renders the request form / "check inbox" confirmation as a client
 * island.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthBackLink href="/auth/sign-in" />
      <ForgotPasswordStep />
    </div>
  );
}
