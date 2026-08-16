"use client";

import { useEffect, useRef } from "react";
import { CircleAlertIcon } from "lucide-react";
import { useFormState, type Control, type FieldValues } from "react-hook-form";

import { Alert, AlertTitle } from "@workspace/ui/components/shadcn/alert";

/**
 * Form-level (server) error banner. Reads the message RHF stores under `root.serverError`
 * (set by `submitWithFormError` when an injected handler throws) and — because clicking
 * submit disables the button and drops focus to `<body>` — moves focus to itself when the
 * message appears, so keyboard/AT users land on the error (`role="alert"` also announces
 * it). Subscribes via `useFormState`, so the parent form isn't re-rendered by it.
 * Field-level (validation) errors stay inline on their field via `FieldError`. (ADR 0026.)
 */
export function FormError<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  const { errors, submitCount } = useFormState({ control });
  const message = errors.root?.serverError?.message;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) {
      ref.current?.focus();
    }
    // `submitCount` is a dep so a repeat of the same message re-focuses the banner.
  }, [message, submitCount]);

  if (!message) {
    return null;
  }

  return (
    <Alert
      ref={ref}
      tabIndex={-1}
      variant="destructive"
      className="outline-none"
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  );
}
