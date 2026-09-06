"use client";

import {
  useFormState,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { submitWithFormError } from "@workspace/ui/components/form/form-submit";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Shared form shell that owns the app-wide submit / pending-state pattern (ADR 0022):
 * renders the `<form>`, wires the injected `onSubmit` through `submitWithFormError`
 * (server errors → `root.serverError`, re-entrancy guard, clears stale root first), and
 * sets `aria-busy` while submitting. Fields stay enabled; only the `SubmitButton` disables.
 * Focus-to-error on failure lives in `FormError` (it focuses itself when the banner appears).
 *
 * `useFormState` (not a bare `form.formState` read) so this subtree actually re-renders on
 * `isSubmitting`; the parent form component reads no form state, so it renders once and the
 * per-field/`SubmitButton`/`FormError` subscriptions stay isolated.
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<void> | void;
  className?: string;
  children: React.ReactNode;
}) {
  const { isSubmitting } = useFormState({ control: form.control });

  return (
    <form
      onSubmit={submitWithFormError(form, onSubmit)}
      noValidate
      aria-busy={isSubmitting || undefined}
      className={cn("flex flex-col gap-6", className)}
    >
      {children}
    </form>
  );
}
