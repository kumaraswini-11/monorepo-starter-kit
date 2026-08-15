"use client";

import { useRouter } from "next/navigation";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { EmailCaptureForm } from "@/components/auth/email-capture-form";

/**
 * Client wiring for the email step: captures the address into the auth-flow state and
 * advances to the password step. Keeps `EmailCaptureForm` presentational (ADR 0025) and
 * the page a static shell (ADR 0023) — only this thin wrapper is client. `defaultEmail`
 * re-fills the field when the user comes Back from the password step.
 */
export function EmailStep() {
  const router = useRouter();
  const { email, setEmail } = useAuthFlow();

  return (
    <EmailCaptureForm
      defaultEmail={email}
      onSubmit={(value) => {
        setEmail(value);
        router.push("/auth/password");
      }}
    />
  );
}
