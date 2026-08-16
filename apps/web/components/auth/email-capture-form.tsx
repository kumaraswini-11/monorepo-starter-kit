"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@workspace/ui/components/shadcn/field";

import { Form } from "@/components/form/form";
import { FormError } from "@/components/form/form-error";
import { FormTextField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { emailFormSchema, type EmailFormValues } from "@/lib/validation";

/**
 * Email capture — step 2 of the method-first auth flow (auth-ui-ux spec §3.2, §11).
 *
 * Presentational per ADR 0025: the submit handler is *injected*, so this component knows
 * nothing about where the email goes — it works against the Better Auth browser client
 * (fullstack) or a `fetch` to a separate API with no rewrite. Submit/pending behaviour
 * (aria-busy, spinner + label, server-error banner, re-entrancy guard) is the shared `Form`
 * pattern (ADR 0026); `onSubmit` may throw a `FormSubmitError` to surface a server error.
 */
export function EmailCaptureForm({
  onSubmit,
  defaultEmail = "",
}: {
  onSubmit?: (email: string) => Promise<void> | void;
  defaultEmail?: string;
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
          // Spec §3.2/§5 mandate autofocus: the user explicitly chose the email path, so
          // focusing the one field they came for is expected, not disorienting.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        {/* Submit stays enabled until clicked (then disabled while in flight) — the
            "enabled until valid" a11y stance (ADR 0024/0026), not disabled-until-valid. */}
        <SubmitButton control={form.control} pendingLabel="Checking…">
          Continue
        </SubmitButton>
      </FieldGroup>
    </Form>
  );
}
