"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";

import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";

/**
 * React Hook Form-bound field components, built on shadcn's Base UI `Field` primitives.
 * One place owns the accessibility wiring (`aria-invalid`, `aria-describedby`, the
 * `role="alert"` error, id ↔ label linking) so every form gets it for free.
 *
 * We bind with `useController` (controlled), not `register`: our inputs are Base UI
 * primitives, which re-render per keystroke even when registered uncontrolled
 * (mui/base-ui#3819), so `register` buys nothing here — while `useController` isolates
 * re-renders to the one field, is RHF's documented path for external UI libraries, and
 * gives the password field its live value for the strength meter.
 *
 * Fields stay ENABLED during submit (ADR 0026): only the submit button is disabled, so
 * keyboard focus is never dropped mid-submit. Deliberately NOT shadcn's
 * `<Form>`/`<FormField>` — that wrapper is Radix-Slot-based and we run no Radix (ADR 0014);
 * the `FieldError` `errors` prop already takes RHF's `fieldState.error` shape.
 */

type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: React.ReactNode;
  /** Right-aligned content in the label row (e.g. a "Forgot password?" link). */
  labelAction?: React.ReactNode;
};

/** Input props a caller may pass through — minus the ones `useController` / the form own. */
type ControlledInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "id" | "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "disabled"
>;

function FieldLabelRow({
  htmlFor,
  label,
  action,
}: {
  htmlFor: string;
  label: React.ReactNode;
  action?: React.ReactNode;
}) {
  if (!action) {
    return <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>;
  }
  return (
    <div className="flex items-center justify-between">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {action}
    </div>
  );
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  labelAction,
  ...inputProps
}: BaseFieldProps<T> & ControlledInputProps) {
  const { field, fieldState } = useController({ control, name });
  const errorId = `${name}-error`;

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabelRow htmlFor={name} label={label} action={labelAction} />
      <Input
        {...inputProps}
        {...field}
        id={name}
        aria-invalid={fieldState.invalid || undefined}
        aria-describedby={fieldState.error ? errorId : undefined}
      />
      <FieldError id={errorId} errors={[fieldState.error]} />
    </Field>
  );
}

export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  label,
  labelAction,
  showStrength = false,
  ...inputProps
}: BaseFieldProps<T> & ControlledInputProps & { showStrength?: boolean }) {
  const { field, fieldState } = useController({ control, name });
  const errorId = `${name}-error`;

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabelRow htmlFor={name} label={label} action={labelAction} />
      <PasswordInput
        {...inputProps}
        {...field}
        id={name}
        aria-invalid={fieldState.invalid || undefined}
        aria-describedby={fieldState.error ? errorId : undefined}
      />
      {showStrength && (
        <PasswordStrength
          password={typeof field.value === "string" ? field.value : ""}
        />
      )}
      <FieldError id={errorId} errors={[fieldState.error]} />
    </Field>
  );
}
