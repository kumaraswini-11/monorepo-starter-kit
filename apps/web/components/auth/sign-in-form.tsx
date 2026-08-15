"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/shadcn/field";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

import { AuthEmailField } from "@/components/auth/auth-email-field";
import { PasswordInput } from "@/components/auth/password-input";
import { firstError, signInPasswordField } from "@/lib/validation";

/**
 * Sign-in credential form (returning user). Presentational per ADR 0025 — the email is a
 * prop and the submit handler is injected, so it's agnostic to how sign-in is performed.
 * Client validation is minimal (non-empty); the real check is server-side.
 */
export function SignInForm({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit?: (password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  const error = showErrors
    ? firstError(signInPasswordField, password)
    : undefined;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (firstError(signInPasswordField, password)) {
      return;
    }
    startTransition(async () => {
      await onSubmit?.(password);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <AuthEmailField email={email} />

        <Field data-invalid={Boolean(error)}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            // First editable field on a step the user navigated to (spec §3.3).
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            disabled={pending}
          />
          <FieldError id="password-error">{error}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
