import { AuthStepSkeleton } from "@/components/auth/auth-step-skeleton";

/** Route-level fallback while an `/auth/*` segment loads (ADR 0023). */
export default function AuthLoading() {
  return <AuthStepSkeleton />;
}
