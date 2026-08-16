import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Thrown by a form's (injected) submit handler to surface a specific, already-user-safe
 * message under RHF's `root.serverError`. This is the ONLY error whose message is shown
 * verbatim — everything else falls back to a generic message, so an unexpected or raw
 * upstream error (SDK/network failure, an enumeration hint like "user not found") can never
 * leak into the UI. Wiring maps known API failures to enumeration-safe copy and throws
 * this; unexpected errors just propagate to the generic fallback. (ADR 0025 §2 / 0026.)
 */
export class FormSubmitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormSubmitError";
  }
}

/** Message to display for a thrown submit error — safe-by-default (see `FormSubmitError`). */
export function toFormErrorMessage(error: unknown): string {
  return error instanceof FormSubmitError && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * Wrap a form's submit so a throwing (injected) handler surfaces as a form-level error
 * under `root.serverError` (rendered by `FormError`). It:
 *  - clears any prior root error *before* validation, so a stale server banner never sits
 *    above fresh field errors (a resubmit that fails zod validation still clears it);
 *  - guards against a re-entrant submit while one is in flight — the disabled button covers
 *    clicks, this covers the Enter key (RHF does not promise to block concurrent submits).
 *
 * Field validation is handled by the zod resolver; `formState.isSubmitting` stays the
 * pending state (RHF owns the async lifecycle). (ADR 0026.)
 */
export function submitWithFormError<T extends FieldValues>(
  form: UseFormReturn<T>,
  handler: (values: T) => Promise<void> | void
) {
  const run = form.handleSubmit(async (values) => {
    try {
      await handler(values);
    } catch (error) {
      form.setError("root.serverError", { message: toFormErrorMessage(error) });
    }
  });

  return (event: React.BaseSyntheticEvent) => {
    if (form.formState.isSubmitting) {
      event.preventDefault();
      return;
    }
    form.clearErrors("root");
    return run(event);
  };
}
