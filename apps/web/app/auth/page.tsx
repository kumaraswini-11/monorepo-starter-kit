import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon } from "lucide-react";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { brand } from "@workspace/ui/lib/brand";
import { cn } from "@workspace/ui/lib/utils";

import { AuthHeader } from "@/components/auth/auth-header";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = { title: "Authentication" };

/**
 * Auth entry — the method chooser at `/auth`. Static Server Component shell (ADR 0023):
 * it reads no request data, so it prerenders and is edge-cacheable. `/` dispatches
 * visitors here (or to `/dashboard` when a session already exists).
 */
export default function AuthEntryPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeader
        title="Sign in or create an account"
        description="Continue with Google, or use your email address."
      />

      {/*
       * Each label sits in a shared `min-w-38` box so both icon+label groups are the
       * same width and therefore centre to the same x — otherwise "Google" vs "email"
       * makes each group start at a different point and the icons don't line up down
       * the stack. `min-w` (not `w`) so a longer translation grows the box rather than
       * overflowing `whitespace-nowrap`. Trade-off: the shorter label lands a few px
       * left of true centre, which is unavoidable while the icons stay aligned.
       */}
      <div className="flex flex-col gap-2">
        {/*
         * A client island (ADR 0023/0025): the page stays a static shell while just this button
         * hydrates to start the Google OAuth redirect via the seam (lib/auth/actions.ts).
         */}
        <GoogleSignInButton />

        <Link
          href="/auth/email"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full"
          )}
        >
          <MailIcon data-icon="inline-start" aria-hidden="true" />
          <span className="min-w-38 text-start">Continue with email</span>
        </Link>
      </div>

      <p className="mt-2 text-sm text-pretty text-muted-foreground">
        By continuing, you agree to our{" "}
        <a
          href={brand.legal.terms}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href={brand.legal.privacy}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
