import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { isNewDeviceSignIn } from "@workspace/db";
import { db, pool } from "@workspace/db/client";
import { session, user } from "@workspace/db/schema";

/**
 * Integration tests for `isNewDeviceSignIn` against real Postgres (ADR 0029 §11) — this
 * verifies the actual SQL (the `userId = X AND id != current` filter and the user-agent
 * comparison), which a mocked db could never prove. Truncate between tests for isolation.
 */

async function truncate() {
  await db.execute(
    sql`TRUNCATE "user", "session", "account", "verification" RESTART IDENTITY CASCADE`
  );
}

async function seedUser() {
  const id = randomUUID();
  await db
    .insert(user)
    .values({ id, name: "Ada Lovelace", email: `${id}@example.com` });
  return id;
}

async function seedSession(userId: string, userAgent: string | null) {
  const id = randomUUID();
  await db.insert(session).values({
    id,
    userId,
    userAgent,
    token: randomUUID(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return id;
}

beforeEach(truncate);
afterAll(async () => {
  await pool.end();
});

describe("isNewDeviceSignIn (real Postgres)", () => {
  it("returns false for the user's first-ever session", async () => {
    const userId = await seedUser();
    const current = await seedSession(userId, "UA-first");

    const result = await isNewDeviceSignIn({
      userId,
      currentSessionId: current,
      userAgent: "UA-first",
    });

    expect(result).toBe(false);
  });

  it("returns false when another session shares the user agent (known device)", async () => {
    const userId = await seedUser();
    await seedSession(userId, "UA-known");
    const current = await seedSession(userId, "UA-known");

    const result = await isNewDeviceSignIn({
      userId,
      currentSessionId: current,
      userAgent: "UA-known",
    });

    expect(result).toBe(false);
  });

  it("returns true when other sessions exist but none match the user agent (new device)", async () => {
    const userId = await seedUser();
    await seedSession(userId, "UA-old");
    const current = await seedSession(userId, "UA-new");

    const result = await isNewDeviceSignIn({
      userId,
      currentSessionId: current,
      userAgent: "UA-new",
    });

    expect(result).toBe(true);
  });
});
