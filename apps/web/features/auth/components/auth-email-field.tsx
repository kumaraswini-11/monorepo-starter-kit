import Link from "next/link";
import { useId } from "react";

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";

/**
 * Read-only identity field shared by the credential steps: shows the email captured at
 * `/auth/email` with a "Change" link back to it (spec §3.3/§10 — a locked email must
 * offer a visible way to change it). `autoComplete="username"` pairs it with the password
 * field so password managers fill the split flow.
 */
export function AuthEmailField({ email }: { email: string }) {
  // Unique per instance (a docs page or a modal may mount two) — never a literal id.
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={id}>Email</FieldLabel>
        <Link
          href="/auth/email"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Change
        </Link>
      </div>
      <Input
        id={id}
        type="email"
        value={email}
        readOnly
        autoComplete="username"
        aria-describedby={hintId}
      />
      <FieldDescription id={hintId}>
        Email is fixed for this step. Use Change to pick a different address.
      </FieldDescription>
    </Field>
  );
}
