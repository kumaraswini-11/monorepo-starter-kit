import { Skeleton } from "@workspace/ui/components/shadcn/skeleton";

/**
 * Streaming fallback for the authenticated area while the server resolves the
 * session (this segment is dynamic). Shape mirrors the dashboard card to avoid
 * layout shift.
 */
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-2 h-9 w-28" />
      </div>
    </main>
  );
}
