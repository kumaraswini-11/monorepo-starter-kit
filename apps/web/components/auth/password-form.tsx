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
import { Input } from "@workspace/ui/components/shadcn/input";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

import { PasswordInput } from "@/components/auth/password-input";
import { signInPasswordField } from "@/lib/validation";

/** Module scope so the function isn't recreated per render. */
function validate(value: string): string | undefined {
  const parsed = signInPasswordField.safeParse(value);
  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

/**
 * Password entry for the sign-in path — email shown read-only (identity confirmation),
 * then the password. Presentational per ADR 0025: the submit handler is injected, so the
 * form is agnostic to how sign-in is performed (Better Auth client or a separate API).
 *
 * Client-side validation is intentionally minimal (non-empty) — the real password policy
 * is enforced server-side. The read-only email carries `autoComplete="username"` and the
 * field `autoComplete="current-password"` so password managers still fill a split flow.
 *
 * (Sign-up mode — a "confirm password" field — is a later addition; this stays the single
 * home for password entry.)
 */
export function PasswordForm({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit?: (password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  const error = showErrors ? validate(password) : undefined;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (validate(password)) {
      return;
    }
    startTransition(async () => {
      await onSubmit?.(password);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            {/* Spec §3.3/§10: a read-only email must offer a visible way to change it. */}
            <Link
              href="/auth/email"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Change
            </Link>
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            autoComplete="username"
            className="text-muted-foreground"
          />
        </Field>

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
            // Password is the one actionable field on this dedicated step (spec §3.3).
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
