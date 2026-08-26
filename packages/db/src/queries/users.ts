import { eq } from "drizzle-orm";

import { db } from "@workspace/db/client";
import { user } from "@workspace/db/schema";

/**
 * User-aggregate queries. Data access lives in packages/db (the repository
 * boundary, ADR 0012) so consumers never issue SQL directly. One module per
 * aggregate keeps the data layer navigable as queries grow (see docs/decisions).
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
