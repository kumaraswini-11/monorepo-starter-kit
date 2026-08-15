import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon } from "lucide-react";

import { GoogleIcon } from "@workspace/ui/components/icons/google-icon";
import { Button, buttonVariants } from "@workspace/ui/components/shadcn/button";
import { cn } from "@workspace/ui/lib/utils";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Auth entry — the app's first screen. Server Component (no interactivity), so the
 * whole screen is a static shell (ADR 0023). Minimal by design: left-aligned brand +
 * heading, two method buttons (Google, email). No decorative background yet (ADR 0024).
 */
export default function AuthEntryPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Logo className="h-6 w-auto" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Sign In or Join Now!
          </h1>
          <p className="text-muted-foreground">
            Sign in or create your efferd account.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/*
         * Presentational for now — Google OAuth is wired later (ADR 0025 keeps the UI
         * wiring-agnostic), so there is no handler yet and the page stays static.
         */}
        <Button type="button" variant="outline" size="lg" className="w-full">
          <GoogleIcon data-icon="inline-start" />
          Continue with Google
        </Button>

        <Link
          href="/sign-in/email"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full"
          )}
        >
          <MailIcon data-icon="inline-start" />
          Continue with email
        </Link>
      </div>

      <p className="text-sm text-balance text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
