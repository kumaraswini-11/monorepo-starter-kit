import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@workspace/db/schema";

/**
 * Pooled Postgres connection. `pg` connects lazily (on first query), so importing
 * this module without a live `DATABASE_URL` — e.g. during `next build` in CI — is
 * safe; it only fails when a query is actually issued. (ADR 0019.)
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { pool, schema };
export type Database = typeof db;
