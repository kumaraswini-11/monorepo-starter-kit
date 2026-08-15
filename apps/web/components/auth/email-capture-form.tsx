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
 * Email capture — step 2 of the method-first auth flow (auth-ui-ux spec §3.2, §11).
 *
 * Presentational per ADR 0025: the submit handler is *injected*, so this component
 * knows nothing about where the email goes. The same form works against the Better
 * Auth browser client (fullstack) or a `fetch` to a separate API — no rewrite when the
 * backend is decided. `onSubmit` is optional while the screen is UI-only.
 *
 * No React Hook Form: ADR 0025 installs it at the first *non-trivial* form, and a
 * single field validated by the zod schema we already ship doesn't clear that bar.
 */
export function EmailCaptureForm({
  onSubmit,
  defaultEmail = "",
}: {
  onSubmit?: (email: string) => Promise<void> | void;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  // Derived, not stored: "reward early, punish late" — stay quiet until the first
  // submit attempt, then re-validate on every keystroke so the error clears as soon
  // as the address becomes valid.
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
            // Spec §3.2/§5 mandate autofocus: the user explicitly chose the email path,
            // so focusing the one field they came for is expected, not disorienting.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
            disabled={pending}
          />
          {/* `FieldError` renders `role="alert"`, so the message is announced. */}
          <FieldError id="email-error">{error}</FieldError>
        </Field>

        {/*
         * Submit stays ENABLED and validates on click — a deliberate deviation from spec
         * §5's "disabled until valid": a disabled submit gives no reason, leaves the tab
         * order, and hides the blocker from screen readers. Enabled + a specific inline
         * error is the accessible pattern (WCAG-aligned; ADR 0024).
         */}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Checking…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
