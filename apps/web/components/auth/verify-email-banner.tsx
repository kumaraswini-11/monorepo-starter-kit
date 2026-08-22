"use client";

import { useEffect, useState } from "react";
import { MailWarningIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { toast } from "@workspace/ui/components/shadcn/toast";

import { resendVerificationEmail } from "@/lib/auth/actions";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Top banner for signed-in but unverified users — progressive verification (ADR 0016): the
 * account works, we just nudge them to verify. Better Auth sends the link on sign-up; this
 * lets them resend (throttled by BA's rate limiter + a local cooldown). Clicking the emailed
 * link is handled by BA's route handler, which redirects to the callbackURL.
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setPending(true);
    try {
      await resendVerificationEmail(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.add({
        title: "Verification email sent",
        description: `Check ${email} for the link.`,
        type: "success",
      });
    } catch {
      toast.add({
        title: "Couldn't send the email",
        description: "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm">
        <MailWarningIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-pretty text-muted-foreground">
          Verify your email — we sent a link to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ms-auto tabular-nums"
          disabled={pending || cooldown > 0}
          onClick={resend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </Button>
      </div>
    </div>
  );
}
