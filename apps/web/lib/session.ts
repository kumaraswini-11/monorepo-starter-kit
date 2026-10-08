import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@workspace/auth";

/**
 * Request-memoized session read. React `cache()` dedupes the lookup within a single
 * request, so a guard layout and the page it wraps share one `getSession` call instead
 * of two. Server-only: the `server-only` import fails the build if a client bundle pulls
 * this in (and `next/headers` throws in the browser regardless).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Per-page guard. The `(app)` layout also redirects, but Next documents that a layout's check
 * does not re-run on client navigation and does not stop its pages from rendering (Next 16
 * authentication guide, "Layouts and auth checks"), so every authed page calls this first.
 * Memoised with `getSession` — one read per request. (ADR 0032 interim; the full Data Access
 * Layer is still the target.)
 */
export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
});
