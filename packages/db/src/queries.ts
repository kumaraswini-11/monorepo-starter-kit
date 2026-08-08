import { and, eq, ne } from "drizzle-orm";

import { db } from "@workspace/db/client";
import { session, user } from "@workspace/db/schema";

/**
 * Data access lives here in packages/db (the repository boundary, ADR 0019) so
 * consumers like packages/auth never issue SQL directly. These back the auth
 * security-notification emails (ADR 0020).
 */

/** Fetch the fields the security emails need (email + display name) by user id. */
export async function getUserById(
  userId: string
): Promise<{ id: string; email: string; name: string } | null> {
  const rows = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Heuristic "new device" check for the new-sign-in security email (spec §4): true
 * when the user already has other sessions but none share this session's user agent.
 * The user's very first session returns false — it's their first device, not a *new*
 * one, so signup/first-login doesn't self-alert.
 *
 * Device identity is the raw user-agent string across currently-stored sessions.
 * Expired/revoked sessions are pruned, so this is best-effort, not a durable device
 * registry; a dedicated known-devices table (plus parsed UA + geo-IP) is a
 * deploy-time enhancement (see the hook in packages/auth).
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
