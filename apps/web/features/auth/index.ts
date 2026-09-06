/**
 * Public API for the auth feature (ADR 0028). Routes, the app shell, and other features import from
 * `@/features/auth` only — never a deep path into this folder. Named re-exports, kept to the
 * feature's public surface: the step wrappers the `/auth/*` routes compose, the flow provider, the
 * verify-email banner, the Google button, and the sign-out hook. Internals (forms, field, the flow
 * hooks, `actions.ts` seam, `validation`, `lib/auth-client`) stay private behind this entry.
 *
 * Note: the server session read still lives at `@/lib/session` (app-level session infra); it moves
 * to `features/auth/lib/session.ts` once the temporary dev-bypass is removed (ADR 0017 / 0028).
 */
export { AuthBackLink } from "./components/auth-back-link";
export { AuthFlowProvider } from "./components/auth-flow-provider";
export { AuthHeader } from "./components/auth-header";
export { AuthStepSkeleton } from "./components/auth-step-skeleton";
export { EmailStep } from "./components/email-step";
export { ForgotPasswordStep } from "./components/forgot-password-step";
export { GoogleSignInButton } from "./components/google-sign-in-button";
export { ResetPasswordStep } from "./components/reset-password-step";
export { SignInStep } from "./components/sign-in-step";
export { SignUpStep } from "./components/sign-up-step";
export { VerifyEmailBanner } from "./components/verify-email-banner";
export { useSignOut } from "./hooks/use-sign-out";
