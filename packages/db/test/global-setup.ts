import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { applyMigrations } from "@workspace/db/testing/migrate";

/**
 * Type what this harness `provide`s so the workers' `inject("DATABASE_URL")` (in
 * `setup-env.ts`) resolves to `string` instead of `never`. This is the officially-documented
 * way to type the provide/inject channel; it augments the whole test tsc program. (ADR 0029)
 */
declare module "vitest" {
  interface ProvidedContext {
    DATABASE_URL: string;
  }
}

/**
 * Integration-test harness (ADR 0029 §11): start one ephemeral, prod-identical Postgres
 * (`postgres:17` over the real `node-postgres` driver), apply the real Drizzle migrations so
 * the schema matches production, and hand the connection string to the workers via `provide`.
 * Runs once for the whole run; the returned teardown stops the container.
 *
 * The context is typed structurally (just `provide`) to avoid depending on Vitest's exported
 * setup-context type name, which differs across major versions.
 */
export default async function setup(ctx: {
  provide: (key: "DATABASE_URL", value: string) => void;
}) {
  const container = await new PostgreSqlContainer("postgres:17").start();

  try {
    const connectionString = container.getConnectionUri();
    await applyMigrations(connectionString);
    ctx.provide("DATABASE_URL", connectionString);

    return async () => {
      await container.stop();
    };
  } catch (error) {
    // Never leak the container if setup fails before the teardown is returned.
    await container.stop();
    throw error;
  }
}
