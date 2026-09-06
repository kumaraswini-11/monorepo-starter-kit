import { z } from "zod";

import { emailField, passwordField } from "@/lib/validation";

/**
 * Auth form schemas — exactly the fields each React Hook Form owns, composed from the shared field
 * rules (`@/lib/validation`). These are **auth-scoped**, so they live with the feature (ADR 0028),
 * while the reusable field rules stay shared. Client-side UX validation only; Better Auth enforces
 * the real policy server-side.
 *
 * On the credential steps the email is fixed from the flow (a prop, not an editable field), so it
 * isn't in those schemas; only `/auth/email` and forgot-password put the email under the form.
 */

/** Sign-in only checks the field isn't empty — the real policy is enforced server-side. */
const signInPasswordField = z.string().min(1, "Password is required");

export const emailFormSchema = z.object({ email: emailField });
export const signInFormSchema = z.object({ password: signInPasswordField });
export const signUpFormSchema = z.object({
  name: z.string().trim().optional(),
  password: passwordField,
});
export const newPasswordFormSchema = z.object({ password: passwordField });

export type EmailFormValues = z.infer<typeof emailFormSchema>;
export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
export type NewPasswordFormValues = z.infer<typeof newPasswordFormSchema>;
