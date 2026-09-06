// Build-time guard: fail if the DB layer is ever imported into a client bundle
// (ADR 0016 — server-only data access).
import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@workspace/db/schema";
import { env } from "@workspace/env";

/**
 * Pooled Postgres connection. `DATABASE_URL` is validated by `@workspace/env`
 * (fail-fast — ADR 0013); `pg` still connects lazily (on first query), so a CI
 * `next build` with `SKIP_ENV_VALIDATION=1` stays safe. (ADR 0012.)
 *
 * Cached on `globalThis` so Turbopack HMR doesn't leak a new pool on every edit
 * ("too many clients" in dev); prod evaluates this module once, so the cache is a
 * harmless no-op there. (Unconditional — reading `process.env.NODE_ENV` here would trip
 * the repo's `no-restricted-syntax` env choke-point rule.)
 */
const globalForDb = globalThis as unknown as { __workspaceDbPool?: Pool };
const pool = (globalForDb.__workspaceDbPool ??= new Pool({
  connectionString: env.DATABASE_URL,
}));

export const db = drizzle(pool, { schema });
export { pool, schema };
export type Database = typeof db;
