import { Skeleton } from "@workspace/ui/components/shadcn/skeleton";

/**
 * Streaming fallback for an authenticated *page's* async work, rendered inside the app shell
 * (the sidebar + header from the `(app)` layout stay put). It does **not** cover the session
 * guard: `await getSession()` runs in the layout, above this Suspense boundary, so during the
 * (cache-memoized, fast) session read the previous route stays visible — by design.
 *
 * A `<div role="status">` — not a second `<main>`; `SidebarInset` already owns the page's single
 * `<main>` (ADR 0020) — with an `sr-only` label announces "Loading…". The bars mirror the
 * dashboard's top-aligned shape (h1 + card) so the skeleton resolves without a layout shift.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-2xl p-6"
    >
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <Skeleton className="h-6 w-28" />
        <div className="mt-6 flex flex-col gap-3 rounded-xl border p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
}
