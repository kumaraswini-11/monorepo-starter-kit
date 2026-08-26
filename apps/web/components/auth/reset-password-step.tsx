"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { toast } from "@workspace/ui/components/shadcn/toast";
import { brand } from "@workspace/ui/lib/brand";
import { cn } from "@workspace/ui/lib/utils";

import { AuthHeader } from "@/components/auth/auth-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { resetPassword } from "@/lib/auth/actions";

/**
 * Client wiring for `/auth/reset-password`. The reset token rides the URL (a signed,
 * single-use, short-lived token — the standard reset mechanism, not PII, so this is the
 * "resume via token" exception to the no-PII-in-URL rule). No token → an expired/invalid
 * state. On success we send the user to sign in with the new password (sessions are
 * revoked on reset — ADR 0011; not auto-logged-in, for security).
 */
export function ResetPasswordStep() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  if (!token) {
    return (
      <>
        <AuthHeader
          title="This link has expired"
          description="Password reset links are single-use and time-limited. Request a new one to continue."
        />
        <Link
          href="/auth/forgot-password"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeader
        title="Set a new password"
        description={`Choose a new password for your ${brand.name} account.`}
      />
      <ResetPasswordForm
        onSubmit={async (password) => {
          await resetPassword(token, password);
          toast.add({
            title: "Password updated",
            description: "Sign in with your new password.",
            type: "success",
          });
          router.push("/auth/sign-in");
        }}
      />
      {/*
       * Always-visible recovery path: if the token turns out to be invalid/expired only on
       * submit, the FormError points here so the user isn't stranded (they'd otherwise have
       * to back out through Sign in → Forgot password).
       */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        This link expired?{" "}
        <Link
          href="/auth/forgot-password"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Request a new one
        </Link>
      </p>
    </>
  );
}
