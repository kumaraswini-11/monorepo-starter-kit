"use client";

import { useEffect, useState } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";

import { useAuthFlow } from "@/components/auth/auth-flow-provider";
import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Client wiring for `/auth/forgot-password`. Two states: the request form, then an
 * enumeration-safe "check your inbox" confirmation (spec §1 — we never reveal whether the
 * address is registered). The email pre-fills from the flow when the user arrived from
 * sign-in. Sending the email is wired later (the template + `onPasswordReset` already
 * exist in `packages/email` / `packages/auth`).
 */
export function ForgotPasswordStep() {
  const { email: flowEmail } = useAuthFlow();
  const [sentTo, setSentTo] = useState<string | null>(null);

  function sendReset(email: string) {
    // Wiring: await authClient.forgetPassword({ email, redirectTo: "/auth/reset-password" }).
    // Advance regardless of whether the account exists (enumeration-safe).
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <SentConfirmation email={sentTo} onResend={() => sendReset(sentTo)} />
    );
  }

  return (
    <>
      <AuthHeader
        title="Reset your password"
        description="Enter your email and we'll send you a link to reset it."
      />
      <ForgotPasswordForm defaultEmail={flowEmail} onSubmit={sendReset} />
    </>
  );
}

function SentConfirmation({
  email,
  onResend,
}: {
  email: string;
  onResend: () => void;
}) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <>
      <AuthHeader
        title="Check your inbox"
        description={`If an account exists for ${email}, we've sent a link to reset your password.`}
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm text-pretty text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or resend below.
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={cooldown > 0}
          onClick={() => {
            setCooldown(RESEND_COOLDOWN_SECONDS);
            onResend();
          }}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
        </Button>
      </div>
    </>
  );
}
