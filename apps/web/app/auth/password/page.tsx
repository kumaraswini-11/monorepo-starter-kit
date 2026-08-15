import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { cn } from "@workspace/ui/lib/utils";

import { AuthHeader } from "@/components/auth/auth-header";
import { PasswordStep } from "@/components/auth/password-step";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Password entry — step 3 of the sign-in path, at `/auth/password`. Server Component
 * shell (ADR 0023): the back link and header are static; `PasswordStep` adds the client
 * guard + form. Reached only via the flow from `/auth/email` (it needs the captured
 * email); arriving without one restarts at the email step.
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

      <AuthHeader
        title="Enter your password"
        description="Enter the password for your account to continue."
      />

      <PasswordStep />
    </div>
  );
}
