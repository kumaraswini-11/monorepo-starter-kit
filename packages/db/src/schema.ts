import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Better Auth core schema (email/password). These four tables mirror Better Auth's
 * documented core. On a Better Auth version bump or plugin change, update this schema to
 * match BA's schema (per its docs / upgrade guide), then
 * generate the migration with `pnpm --filter @workspace/db db:generate`. (The BA CLI
 * `generate` can't run here — it imports the auth instance, which pulls `server-only`.)
 * See ADR 0012 / 0016.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Secondary indexes mirror the `index: true` columns in Better Auth's core table definitions
// (@better-auth/core db/get-tables): every sign-in lists the user's sessions, every OAuth
// callback looks accounts up by user, every verification is found by identifier. Without them
// those are sequential scans at scale (migration 0003).
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  // No (issuer, accountId) index: Better Auth 1.7.0-1.7.2 required one, 1.7.3 removed the
  // requirement and identifies accounts by (providerId, accountId) again, as in 1.6. Migration
  // 0002 drops the index and the column (BA 1.7 upgrade guide, Drizzle path).
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    // Required in Better Auth's core definition (it always writes both); nullable in our 0000
    // migration by mistake — tightened in 0003.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);
