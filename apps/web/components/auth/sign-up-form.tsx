"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Form } from "@workspace/ui/components/form/form";
import { FormError } from "@workspace/ui/components/form/form-error";
import {
  FormPasswordField,
  FormTextField,
} from "@workspace/ui/components/form/form-field";
import { SubmitButton } from "@workspace/ui/components/form/submit-button";
import { FieldGroup } from "@workspace/ui/components/shadcn/field";

import { AuthEmailField } from "@/components/auth/auth-email-field";
import { signUpFormSchema, type SignUpFormValues } from "@/lib/validation";

/**
 * Sign-up credential form (new user). Optional name + password with a live strength meter
 * and the new-password policy (`passwordField`). No confirm field — show/hide covers
 * verification (spec §3.3). Presentational per ADR 0022: email prop + injected submit
 * (which may throw a `FormSubmitError`, e.g. "An account with this email already exists").
 * Pending/submit behaviour is the shared `Form` pattern (ADR 0022).
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
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: "", password: "" },
  });

  return (
    <Form
      form={form}
      onSubmit={async ({ name, password }) => {
        // `name` is already trimmed by the schema; map empty → undefined (optional).
        await onSubmit?.({ password, name: name || undefined });
      }}
    >
      <FormError control={form.control} />
      <FieldGroup>
        <AuthEmailField email={email} />

        <FormTextField
          control={form.control}
          name="name"
          label={
            <>
              Name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </>
          }
          autoComplete="name"
          placeholder="Ada Lovelace"
          // First editable field on a step the user navigated to.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <FormPasswordField
          control={form.control}
          name="password"
          label="Password"
          autoComplete="new-password"
          showStrength
        />

        <SubmitButton control={form.control} pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </FieldGroup>
    </Form>
  );
}
