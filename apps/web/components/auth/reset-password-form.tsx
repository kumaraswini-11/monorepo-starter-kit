"use client";

import { useState, useTransition } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/shadcn/field";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { firstError, passwordField } from "@/lib/validation";

/**
 * Reset-password form — set a new password (with a live strength meter and the
 * new-password policy). Presentational per ADR 0025: the submit handler is injected.
 * No confirm field — show/hide covers verification (spec §3.3).
 */
export function ResetPasswordForm({
  onSubmit,
}: {
  onSubmit?: (password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  const error = showErrors ? firstError(passwordField, password) : undefined;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (firstError(passwordField, password)) {
      return;
    }
    startTransition(async () => {
      await onSubmit?.(password);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            // First field on a step the user navigated to (from the email link).
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            disabled={pending}
          />
          <PasswordStrength password={password} />
          <FieldError id="password-error">{error}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Updating…
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
