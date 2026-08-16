import { z } from "zod";

/**
 * Client-side form schemas + the single-field rules they compose from. These mirror the
 * server rules (Better Auth enforces the real constraints — e.g. `minPasswordLength: 10`);
 * this is fast UX feedback via React Hook Form's zod resolver, not the source of truth.
 * Kept version-proof (a simple regex, no zod string-format helpers).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reusable field rules — shared across the per-form schemas below (and, later, the
 * Settings change-password form: reuse `passwordField`). */
export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .refine((v) => EMAIL_RE.test(v), "Enter a valid email address");

/** New-password policy (sign-up / reset / change-password). Bounds mirror Better Auth
 * (`minPasswordLength: 10`, default `maxPasswordLength: 128`) so the max is caught inline,
 * not only as a server error after the "reward early" promise. */
export const passwordField = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be at most 128 characters");

/** Sign-in only checks the field isn't empty — the real policy is enforced server-side. */
export const signInPasswordField = z.string().min(1, "Password is required");

/**
 * Per-form schemas — each holds exactly the fields React Hook Form owns. On the credential
 * steps the email is fixed from the flow (a prop, not an editable field), so it isn't here;
 * only `/auth/email` and forgot-password put the email under the form.
 */
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
