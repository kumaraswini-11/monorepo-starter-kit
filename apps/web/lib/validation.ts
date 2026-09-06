import { z } from "zod";

/**
 * Reusable, framework-agnostic form-field rules shared across the app's forms (auth today; the
 * Settings change-password form later reuses `passwordField`). Client-side UX validation via React
 * Hook Form's zod resolver — Better Auth enforces the real constraints server-side; these mirror
 * them for fast feedback. Kept version-proof (a simple regex, no zod string-format helpers).
 *
 * Feature-specific *form* schemas compose these rules and live with their feature (e.g.
 * `features/auth/schemas.ts`). Promote these rules to a shared `@workspace/validation` package
 * when a second app — or the separate backend — needs the same contract (ADR 0016 / 0017).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A required, well-formed email. */
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
