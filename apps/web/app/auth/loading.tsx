import { AuthStepSkeleton } from "@/features/auth";

/** Route-level fallback while an `/auth/*` segment loads (ADR 0019). */
export default function AuthLoading() {
  return <AuthStepSkeleton />;
}
