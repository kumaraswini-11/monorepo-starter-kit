"use client";

import { FormSubmitError } from "@workspace/ui/components/form/form-submit";

import { authClient } from "@/lib/auth-client";

/**
 * Client-side auth seam (ADR 0027 §1) — the ONLY module that talks to the Better Auth
 * transport. UI/step components call these; nothing else imports `authClient` directly.
 * Better Auth returns `{ data, error }` (it never throws), so each wrapper converts a
 * returned `error` into a user-safe `FormSubmitError` that the shared `submitWithFormError`
 * renders in the `FormError` banner (ADR 0026). Messages stay enumeration-safe.
 *
 * A future separate-backend split (ADR 0027) changes only this file and
 * `lib/auth-client.ts` — never the forms or steps.
 */

/** Sign in a returning user. Generic copy on any credential failure (enumeration-safe). */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  const { error } = await authClient.signIn.email({ email, password });
  if (error) {
    throw new FormSubmitError("Invalid email or password.");
  }
}

/** Create a new account (Better Auth auto-signs-in on success). */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<void> {
  const { email, password, name } = params;
  const { error } = await authClient.signUp.email({
    email,
    password,
    // Better Auth requires a name; the form's is optional, so fall back to the email
    // local-part (the user can set a real name later in settings).
    name: name ?? email.split("@")[0] ?? email,
  });
  if (error) {
    // The email step routed here because the account didn't exist; a race can still land
    // an "already exists" (safe to reveal at sign-up — the identifier-first trade-off).
    if (error.status === 422) {
      throw new FormSubmitError("An account with this email already exists.");
    }
    throw new FormSubmitError(
      "Could not create your account. Please try again."
    );
  }
}

/**
 * Request a password-reset email. Enumeration-safe: Better Auth returns success even for
 * unknown emails, so the caller advances regardless; only a transport failure surfaces.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: "/auth/reset-password",
  });
  if (error) {
    throw new FormSubmitError(
      "Could not send the reset email. Please try again."
    );
  }
}

/** Complete a password reset with the emailed token. */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const { error } = await authClient.resetPassword({ token, newPassword });
  if (error) {
    throw new FormSubmitError("This reset link is invalid or has expired.");
  }
}

/**
 * Identifier-first routing: which screen the captured email should go to. Calls the Better
 * Auth `account-exists` plugin endpoint (BA-rate-limited); a 429 surfaces as a form error.
 */
export async function resolveAuthRoute(
  email: string
): Promise<"sign-in" | "sign-up"> {
  const { data, error } = await authClient.accountExists({ email });
  if (error) {
    throw new FormSubmitError(
      error.status === 429
        ? "Too many attempts. Please wait a moment and try again."
        : "Something went wrong. Please try again."
    );
  }
  return data?.exists ? "sign-in" : "sign-up";
}

/**
 * Resend the email-verification link (progressive verification, ADR 0016). Throws on failure
 * so the caller (the verify-email banner) can surface it via a toast.
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const { error } = await authClient.sendVerificationEmail({
    email,
    callbackURL: "/dashboard",
  });
  if (error) {
    throw new Error("Could not resend the verification email.");
  }
}
