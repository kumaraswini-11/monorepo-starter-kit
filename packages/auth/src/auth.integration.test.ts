import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { auth } from "@workspace/auth";
import { db, pool } from "@workspace/db/client";
import { account, user } from "@workspace/db/schema";
import { resetDb } from "@workspace/db/testing/reset";

/**
 * Integration tests for the Better Auth email/password flow + our `account-exists` plugin
 * against real Postgres (ADR 0029 §11). These exercise the actual adapter writes (user +
 * account rows, password hashing) and our custom plugin's SQL — things a mocked db can't
 * prove. The auth instance binds the db client from `@workspace/db/client`, which the shared
 * harness has already pointed at the container. `drizzle-orm` is a test-only devDependency
 * here (direct DB assertions); production auth code still goes through @workspace/db (ADR 0019).
 */

const PASSWORD = "correct-horse-battery-staple";

beforeEach(resetDb);
afterAll(async () => {
  await pool.end();
});

describe("Better Auth email/password (real Postgres)", () => {
  it("sign-up creates a user and a hashed-password account", async () => {
    const email = `ada-${randomUUID()}@example.com`;

    await auth.api.signUpEmail({
      body: { name: "Ada Lovelace", email, password: PASSWORD },
    });

    const [createdUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    expect(createdUser?.email).toBe(email);

    const [createdAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, createdUser!.id));
    // Password is stored hashed, never in plaintext.
    expect(createdAccount?.password).toBeTruthy();
    expect(createdAccount?.password).not.toBe(PASSWORD);
  });

  it("the account-exists plugin reports existence from the database", async () => {
    const email = `grace-${randomUUID()}@example.com`;
    await auth.api.signUpEmail({
      body: { name: "Grace Hopper", email, password: PASSWORD },
    });

    const existing = await auth.api.accountExists({ body: { email } });
    expect(existing.exists).toBe(true);

    const unknown = await auth.api.accountExists({
      body: { email: `nobody-${randomUUID()}@example.com` },
    });
    expect(unknown.exists).toBe(false);
  });
});
