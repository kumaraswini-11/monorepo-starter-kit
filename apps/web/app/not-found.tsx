import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Custom 404 (Server Component). Rendered for unmatched routes and any `notFound()`
 * call. The link is styled with `buttonVariants` — the shadcn/Base-UI pattern for a
 * link-as-button (no `asChild` needed).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you were looking for does not exist or may have moved.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </main>
  );
}
