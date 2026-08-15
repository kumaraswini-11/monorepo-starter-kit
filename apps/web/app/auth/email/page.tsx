import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { cn } from "@workspace/ui/lib/utils";

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
      {/* `-ms-1.5` cancels the button's start padding so the arrow sits on the same
          left axis as the wordmark and heading below it. */}
      <Link
        href="/auth"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ms-1.5 self-start text-muted-foreground"
        )}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Link>

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
