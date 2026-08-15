"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { PasswordForm } from "@/components/auth/password-form";

/**
 * Client wiring + guard for the password step. The email lives only in the in-memory
 * auth-flow state (ADR 0025 §4), so a refresh / bookmark / direct navigation arrives with no
 * email — restart the flow at the email step (`replace`, so the dead URL isn't kept in
 * history). Renders nothing while redirecting, to avoid a flash of the form.
 */
export function PasswordStep() {
  const router = useRouter();
  const { email } = useAuthFlow();

  useEffect(() => {
    if (!email) {
      router.replace("/auth/email");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  // `onSubmit` (the actual sign-in call) is injected here during the wiring phase
  // (ADR 0025); the form is UI-only until then.
  return <PasswordForm email={email} />;
}
