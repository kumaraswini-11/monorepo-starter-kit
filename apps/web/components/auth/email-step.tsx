"use client";

import { useRouter } from "next/navigation";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { EmailCaptureForm } from "@/components/auth/email-capture-form";
import { resolveAuthRoute } from "@/lib/auth/actions";

/**
 * Client wiring for the email step: captures the address into the auth-flow state and
 * advances to the credential step. Keeps `EmailCaptureForm` presentational (ADR 0025) and
 * the page a static shell (ADR 0023) — only this thin wrapper is client. `defaultEmail`
 * re-fills the field when the user comes Back from a credential step.
 *
 * Identifier-first: the destination is chosen by a rate-limited account-existence check
 * (`resolveAuthRoute` → ADR 0027 §3) — `/auth/sign-in` for an existing account,
 * `/auth/sign-up` for a new one. A thrown `FormSubmitError` (e.g. rate-limited) surfaces in
 * the form's error banner.
 */
export function EmailStep() {
  const router = useRouter();
  const { email, setEmail } = useAuthFlow();

  return (
    <EmailCaptureForm
      defaultEmail={email}
      onSubmit={async (value) => {
        setEmail(value);
        const route = await resolveAuthRoute(value);
        router.push(`/auth/${route}`);
      }}
    />
  );
}
