"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Form } from "@workspace/ui/components/form/form";
import { FormError } from "@workspace/ui/components/form/form-error";
import { FormPasswordField } from "@workspace/ui/components/form/form-field";
import { SubmitButton } from "@workspace/ui/components/form/submit-button";
import { FieldGroup } from "@workspace/ui/components/shadcn/field";

import {
  newPasswordFormSchema,
  type NewPasswordFormValues,
} from "@/lib/validation";

/**
 * Reset-password form — set a new password (with a live strength meter and the
 * new-password policy). Presentational per ADR 0025: the submit handler is injected (it may
 * throw a `FormSubmitError`, e.g. an expired token). No confirm field — show/hide covers
 * verification (spec §3.3). Pending/submit behaviour is the shared `Form` pattern (ADR 0026).
 */
export function ResetPasswordForm({
  onSubmit,
}: {
  onSubmit?: (password: string) => Promise<void> | void;
}) {
  const form = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordFormSchema),
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
        <FormPasswordField
          control={form.control}
          name="password"
          label="New password"
          autoComplete="new-password"
          showStrength
          // First field on a step the user navigated to (from the email link).
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <SubmitButton control={form.control} pendingLabel="Updating…">
          Set new password
        </SubmitButton>
      </FieldGroup>
    </Form>
  );
}
