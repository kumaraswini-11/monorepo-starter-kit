import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@workspace/auth";
import { db, schema } from "@workspace/db/client";
import { account, session, user } from "@workspace/db/schema";
import { resetDb } from "@workspace/db/testing/reset";
import { sendNewDeviceEmail } from "@workspace/email";
import { env } from "@workspace/env";

// Mock only the true port — the email transport — so the security hooks can be asserted
// without rendering/sending; the adapter writes, hashing, and session creation all run for
// real. `vi.mock` is hoisted above the imports, so `auth`'s own `@workspace/email` import is
// mocked too, and the `sendNewDeviceEmail` imported here is the spy. (ADR 0029 §3)
vi.mock("@workspace/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/email")>()),
  sendNewDeviceEmail: vi.fn().mockResolvedValue(undefined),
  sendVerifyEmail: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Integration tests for the Better Auth email/password flow + our `account-exists` plugin
 * against real Postgres (ADR 0029 §11). These exercise the actual adapter writes (user +
 * account rows, password hashing) and our custom plugin's SQL — things a mocked db can't
 * prove. The auth instance binds the db client from `@workspace/db/client`, which the shared
 * harness has already pointed at the container. `drizzle-orm` is a test-only devDependency
 * here (direct DB assertions); production auth code still goes through @workspace/db (ADR 0019).
 */

const PASSWORD = "correct-horse-battery-staple";

/**
 * Test-only auth instance: same secret + db adapter as production, plus Better Auth's
 * `testUtils()` seeding helpers — kept OUT of the production config, per the Better Auth docs
 * (adding them there ships privileged `ctx.test` helpers). Users/sessions it creates
 * interoperate with the prod `auth` instance because they share the DB + secret. (ADR 0029 §11)
 */
const testAuth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  plugins: [testUtils()],
});

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDb();
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

describe("sign-in (real Postgres)", () => {
  it("returns a session for valid credentials", async () => {
    const email = `signin-${randomUUID()}@example.com`;
    await auth.api.signUpEmail({
      body: { name: "Nikola Tesla", email, password: PASSWORD },
    });

    const result = await auth.api.signInEmail({
      body: { email, password: PASSWORD },
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(email);
  });

  it("rejects an invalid password (server API throws)", async () => {
    const email = `wrongpw-${randomUUID()}@example.com`;
    await auth.api.signUpEmail({
      body: { name: "Alan Turing", email, password: PASSWORD },
    });

    await expect(
      auth.api.signInEmail({ body: { email, password: "not-the-password" } })
    ).rejects.toThrow();
  });
});

describe("new-device security email (session-create hook)", () => {
  it("stays silent on the first session, fires once on a new-device sign-in", async () => {
    const email = `device-${randomUUID()}@example.com`;
    const firstDevice = new Headers({ "user-agent": "Mozilla/5.0 (Device A)" });
    const newDevice = new Headers({ "user-agent": "Mozilla/5.0 (Device B)" });

    // Sign-up auto-creates the first session → no prior device on record → no alert.
    await auth.api.signUpEmail({
      body: { name: "Ada Lovelace", email, password: PASSWORD },
      headers: firstDevice,
    });
    expect(sendNewDeviceEmail).not.toHaveBeenCalled();

    // A sign-in from an unseen user-agent → exactly one alert, addressed to the user.
    await auth.api.signInEmail({
      body: { email, password: PASSWORD },
      headers: newDevice,
    });
    expect(sendNewDeviceEmail).toHaveBeenCalledTimes(1);
    expect(sendNewDeviceEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: email })
    );
  });
});

describe("testUtils seeding helpers (test-only, Better Auth 1.7)", () => {
  it("createUser + login persists a user and mints a real session", async () => {
    const { test } = await testAuth.$context;

    const seeded = await test.saveUser(
      test.createUser({
        name: "Test User",
        email: `mint-${randomUUID()}@example.com`,
      })
    );
    const { token } = await test.login({ userId: seeded.id });
    expect(token).toBeTruthy();

    // The minted session is a real row (usable to seed authenticated state without the UI).
    const [sessionRow] = await db
      .select()
      .from(session)
      .where(eq(session.userId, seeded.id));
    expect(sessionRow).toBeTruthy();
  });
});
