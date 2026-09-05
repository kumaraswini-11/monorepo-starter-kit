import { and, eq, ne } from "drizzle-orm";

import { db } from "@workspace/db/client";
import { session } from "@workspace/db/schema";

/**
 * Session-aggregate queries (repository boundary, ADR 0012).
 */

/**
 * Heuristic "new device" check for the new-sign-in security email (spec §4): true
 * when the user already has other sessions but none share this session's user agent.
 * The user's very first session returns false — it's their first device, not a *new*
 * one, so signup/first-login doesn't self-alert.
 *
 * Device identity is the raw user-agent string across currently-stored sessions.
 * Expired/revoked sessions are pruned, so this is best-effort, not a durable device
 * registry; a dedicated known-devices table is a future enhancement.
 */
export async function isNewDeviceSignIn(params: {
  userId: string;
  currentSessionId: string;
  userAgent: string | null | undefined;
}): Promise<boolean> {
  const others = await db
    .select({ userAgent: session.userAgent })
    .from(session)
    .where(
      and(
        eq(session.userId, params.userId),
        ne(session.id, params.currentSessionId)
      )
    );

  if (others.length === 0) return false;

  const ua = params.userAgent ?? null;
  return !others.some((s) => s.userAgent === ua);
}
