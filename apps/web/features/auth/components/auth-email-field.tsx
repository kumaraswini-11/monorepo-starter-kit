import Link from "next/link";

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
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Link
          href="/auth/email"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Change
        </Link>
      </div>
      <Input
        id="email"
        type="email"
        value={email}
        readOnly
        autoComplete="username"
        aria-describedby="email-hint"
        className="text-muted-foreground"
      />
      <FieldDescription id="email-hint">
        Email is fixed for this step. Use Change to pick a different address.
      </FieldDescription>
    </Field>
  );
}
