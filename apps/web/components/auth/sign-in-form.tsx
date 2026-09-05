"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Form } from "@workspace/ui/components/form/form";
import { FormError } from "@workspace/ui/components/form/form-error";
import { FormPasswordField } from "@workspace/ui/components/form/form-field";
import { SubmitButton } from "@workspace/ui/components/form/submit-button";
import { FieldGroup } from "@workspace/ui/components/shadcn/field";

import { AuthEmailField } from "@/components/auth/auth-email-field";
import { signInFormSchema, type SignInFormValues } from "@/lib/validation";

/**
 * Sign-in credential form (returning user). Presentational per ADR 0022 — the email is a
 * prop and the submit handler is injected, so it's agnostic to how sign-in is performed.
 * Client validation is minimal (non-empty); the real check is server-side, surfaced via
 * `FormError` when the injected `onSubmit` throws a `FormSubmitError` (e.g. an
 * enumeration-safe "Invalid email or password"). Pending/submit behaviour is the shared
 * `Form` pattern (ADR 0022).
 */
export function SignInForm({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit?: (password: string) => Promise<void> | void;
}) {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { password: "" },
  });

  return (
    <Form
      form={form}
      onSubmit={async ({ password }) => {
        await onSubmit?.(password);
      }}
    >
      <FormError control={form.control} />
      <FieldGroup>
        <AuthEmailField email={email} />

        <FormPasswordField
          control={form.control}
          name="password"
          label="Password"
          labelAction={
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
          autoComplete="current-password"
          // First editable field on a step the user navigated to (spec §3.3).
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <SubmitButton control={form.control} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </FieldGroup>
    </Form>
  );
}
