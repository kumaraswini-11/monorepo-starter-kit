"use client";

import { useFormState, type Control, type FieldValues } from "react-hook-form";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Spinner } from "@workspace/ui/components/shadcn/spinner";

/**
 * Submit button for the shared form pattern (ADR 0022): a spinner (decorative) plus a
 * progressive label while submitting, disabled to block a second click. Subscribes only to
 * `isSubmitting` (via `useFormState`) so the parent form doesn't re-render on it. Full width
 * by default, so the idle → pending label swap never shifts layout.
 */
export function SubmitButton<T extends FieldValues>({
  control,
  pendingLabel,
  children,
}: {
  control: Control<T>;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const { isSubmitting } = useFormState({ control });

  return (
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Spinner /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
