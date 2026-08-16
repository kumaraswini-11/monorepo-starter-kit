// Build-time guard: fail if the DB layer is ever imported into a client bundle
// (ADR 0022 — server-only data access).
import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@workspace/db/schema";
import { env } from "@workspace/env";

/**
 * Pooled Postgres connection. `DATABASE_URL` is validated by `@workspace/env`
 * (fail-fast — ADR 0021); `pg` still connects lazily (on first query), so a CI
 * `next build` with `SKIP_ENV_VALIDATION=1` stays safe. (ADR 0019.)
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { pool, schema };
export type Database = typeof db;
