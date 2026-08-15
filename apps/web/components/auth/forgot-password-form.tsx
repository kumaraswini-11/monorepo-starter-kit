"use client";

import { useState, useTransition } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

import { emailField, firstError } from "@/lib/validation";

/**
 * Forgot-password request form — collects the email to send a reset link to.
 * Presentational per ADR 0025: the submit handler is injected. `defaultEmail` pre-fills
 * from the flow when the user arrived from the sign-in screen.
 */
export function ForgotPasswordForm({
  defaultEmail = "",
  onSubmit,
}: {
  defaultEmail?: string;
  onSubmit?: (email: string) => Promise<void> | void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  const error = showErrors ? firstError(emailField, email) : undefined;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (firstError(emailField, email)) {
      return;
    }
    startTransition(async () => {
      await onSubmit?.(email.trim());
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            // First field on a step the user navigated to.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
            disabled={pending}
          />
          <FieldError id="email-error">{error}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
