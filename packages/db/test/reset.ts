import { sql } from "drizzle-orm";

import { db } from "@workspace/db/client";

/**
 * Truncate all tables for integration-test isolation (fast; `beforeEach`). Shared across
 * every package's integration tests via `@workspace/db/testing/reset` (ADR 0029 §11).
 * Extend the table list as the schema grows.
 */
export async function resetDb(): Promise<void> {
  await db.execute(
    sql`TRUNCATE "user", "session", "account", "verification" RESTART IDENTITY CASCADE`
  );
}
