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

import { AuthEmailField } from "@/components/auth/auth-email-field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { firstError, passwordField } from "@/lib/validation";

/**
 * Sign-up credential form (new user). Optional name + password with a live strength meter
 * and the new-password policy (`passwordField`). No confirm field — show/hide covers
 * verification (spec §3.3). Presentational per ADR 0025: email prop + injected submit.
 */
export function SignUpForm({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit?: (values: {
    password: string;
    name?: string;
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
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
      await onSubmit?.({ password, name: name.trim() || undefined });
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <AuthEmailField email={email} />

        <Field>
          <FieldLabel htmlFor="name">
            Name{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            // First editable field on a step the user navigated to.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
          />
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
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
              <Spinner /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
