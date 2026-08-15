import { z } from "zod";

/**
 * Client-side form schemas. These mirror the server rules (Better Auth enforces the
 * real constraints — e.g. `minPasswordLength: 10`); this is fast UX feedback, not the
 * source of truth. Kept version-proof (a simple regex, no zod string-format helpers).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .refine((v) => EMAIL_RE.test(v), "Enter a valid email address");

export const passwordField = z
  .string()
  .min(10, "Password must be at least 10 characters");

/** Sign-in only checks the field isn't empty — the real policy is enforced server-side. */
export const signInPasswordField = z.string().min(1, "Password is required");

export const signInSchema = z.object({
  email: emailField,
  password: signInPasswordField,
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: emailField,
  password: passwordField,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

/** First validation message for a single-field schema, or `undefined` if it passes. */
export function firstError(
  schema: z.ZodType<string>,
  value: string
): string | undefined {
  const parsed = schema.safeParse(value);
  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

/** First error message per field, as a `{ field: message }` map. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}
