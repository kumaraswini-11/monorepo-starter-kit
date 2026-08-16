import { Skeleton } from "@workspace/ui/components/shadcn/skeleton";

/**
 * Placeholder for a credential step while its state resolves — the email-guard redirect
 * (ADR 0025 §4) on `/auth/sign-in` and `/auth/sign-up`, and the `useSearchParams` Suspense
 * boundary on `/auth/reset-password`. Avoids a flash of blank before the form renders or
 * the flow restarts at `/auth/email`. Mirrors the header + one field + submit shape.
 *
 * `role="status"` + an `sr-only` label announce "Loading…" to assistive tech (e.g. during a
 * slow reset-password Suspense); the visual bars are `aria-hidden` decorative chrome.
 * Server-usable (no hooks), so it works both as a client-step fallback and a `<Suspense>`
 * fallback.
 */
export function AuthStepSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col items-start gap-3" aria-hidden="true">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex flex-col gap-7" aria-hidden="true">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
