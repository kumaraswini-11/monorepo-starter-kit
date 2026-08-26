"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Form } from "@workspace/ui/components/form/form";
import { FormError } from "@workspace/ui/components/form/form-error";
import { FormTextField } from "@workspace/ui/components/form/form-field";
import { SubmitButton } from "@workspace/ui/components/form/submit-button";
import { FieldGroup } from "@workspace/ui/components/shadcn/field";

import { emailFormSchema, type EmailFormValues } from "@/lib/validation";

/**
 * Forgot-password request form — collects the email to send a reset link to.
 * Presentational per ADR 0022: the submit handler is injected. `defaultEmail` pre-fills
 * from the flow when the user arrived from the sign-in screen. Pending/submit behaviour is
 * the shared `Form` pattern (ADR 0022).
 */
export function ForgotPasswordForm({
  defaultEmail = "",
  onSubmit,
}: {
  defaultEmail?: string;
  onSubmit?: (email: string) => Promise<void> | void;
}) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: defaultEmail },
  });

  return (
    <Form
      form={form}
      onSubmit={async ({ email }) => {
        await onSubmit?.(email);
      }}
    >
      <FormError control={form.control} />
      <FieldGroup>
        <FormTextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          // First field on a step the user navigated to.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <SubmitButton control={form.control} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </FieldGroup>
    </Form>
  );
}
