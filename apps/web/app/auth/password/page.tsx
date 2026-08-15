import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { cn } from "@workspace/ui/lib/utils";

import { PasswordStep } from "@/components/auth/password-step";

export const metadata: Metadata = { title: "Continue" };

/**
 * Credential step at `/auth/password` — sign-in or sign-up depending on the flow's mode.
 * Server Component shell (ADR 0023): the back link is static; `PasswordStep` renders the
 * mode-aware header + form as a client island (it reads the in-memory flow state).
 * Reached only via `/auth/email` (it needs the captured email); arriving without one
 * restarts at the email step.
 */
export default function PasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* `-ms-1.5` cancels the button's start padding so the arrow sits on the same
          left axis as the wordmark and heading below it. */}
      <Link
        href="/auth/email"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ms-1.5 self-start text-muted-foreground"
        )}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Link>

      <PasswordStep />
    </div>
  );
}
