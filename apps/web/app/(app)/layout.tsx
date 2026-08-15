import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSession } from "@/lib/session";

/**
 * The authed area is per-user and reads the session (cookies) on every request, so
 * there's no useful static shell — opt it out of prerendering (Cache Components /
 * ADR 0023). Public pages (`/auth`) stay static and stream normally.
 */
export const instant = false;

/**
 * Guard for the authenticated area. The session is checked on the server before any
 * protected UI renders — no client-side auth flash, and the redirect happens before
 * bytes are sent. `getSession()` is `cache()`-memoized, so this lookup is shared with
 * the page it wraps (one call per request, not two).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return <>{children}</>;
}
