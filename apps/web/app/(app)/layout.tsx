import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { getSession } from "@/lib/session";

/**
 * The authed area reads the session (`headers()`) on every request, so it's dynamic with
 * no useful static shell. `instant = false` opts this segment out of instant-navigation
 * validation (Cache Components / ADR 0023) — it deliberately blocks on the server guard.
 * Public pages (`/auth`) stay static and stream normally.
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

  return (
    <>
      {!session.user.emailVerified && (
        <VerifyEmailBanner email={session.user.email} />
      )}
      {children}
    </>
  );
}
