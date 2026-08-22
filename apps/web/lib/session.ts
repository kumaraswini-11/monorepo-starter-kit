import "server-only";

import { headers } from "next/headers";
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
