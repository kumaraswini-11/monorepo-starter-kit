"use client";

import { useRouter } from "next/navigation";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { EmailCaptureForm } from "@/components/auth/email-capture-form";

/**
 * Client wiring for the email step: captures the address into the auth-flow state and
 * advances to the credential step. Keeps `EmailCaptureForm` presentational (ADR 0025) and
 * the page a static shell (ADR 0023) — only this thin wrapper is client. `defaultEmail`
 * re-fills the field when the user comes Back from a credential step.
 *
 * Identifier-first: the destination is chosen by an account-existence check —
 * `/auth/sign-in` for an existing account, `/auth/sign-up` for a new one. Until that check
 * is wired it defaults to sign-in (the returning-user path); preview sign-up directly at
 * `/auth/sign-up`.
 */
export function EmailStep() {
  const router = useRouter();
  const { email, setEmail } = useAuthFlow();

  return (
    <EmailCaptureForm
      defaultEmail={email}
      onSubmit={(value) => {
        setEmail(value);
        router.push("/auth/sign-in");
      }}
    />
  );
}
