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

import type { AuthMode } from "@/components/auth/auth-flow-provider";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import {
  firstError,
  passwordField,
  signInPasswordField,
} from "@/lib/validation";

/**
 * Credential step — email shown read-only (identity confirmation), then the password.
 * One component, two modes:
 * - **sign-in**: password + "Forgot password?".
 * - **sign-up**: optional name + password + a live strength meter, and the new-password
 *   policy (`passwordField`). No confirm field — show/hide covers verification (ADR 0025
 *   discussion / spec §3.3).
 *
 * Presentational per ADR 0025: the submit handler is injected, so the form is agnostic to
 * how auth is performed. Client validation is minimal; the real policy is server-side.
 */
export function PasswordForm({
  email,
  mode,
  onSubmit,
}: {
  email: string;
  mode: AuthMode;
  onSubmit?: (values: {
    password: string;
    name?: string;
  }) => Promise<void> | void;
}) {
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  const schema = isSignUp ? passwordField : signInPasswordField;
  const error = showErrors ? firstError(schema, password) : undefined;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (firstError(schema, password)) {
      return;
    }
    startTransition(async () => {
      await onSubmit?.({ password, name: name.trim() || undefined });
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

        {isSignUp ? (
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={pending}
            />
          </Field>
        ) : null}

        <Field data-invalid={Boolean(error)}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            {isSignUp ? null : (
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            // The user reached this dedicated step to type the password (spec §3.3).
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            disabled={pending}
          />
          {isSignUp ? <PasswordStrength password={password} /> : null}
          <FieldError id="password-error">{error}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> {isSignUp ? "Creating account…" : "Signing in…"}
            </>
          ) : isSignUp ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
