import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Better Auth core schema (email/password). These four tables mirror Better Auth's
 * documented core. On a Better Auth version bump or plugin change, update this schema to
 * match BA's schema (per its docs / upgrade guide — e.g. 1.7 added `account.issuer`), then
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

export const session = pgTable("session", {
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
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    // Better Auth 1.7: account identity is scoped by issuer (credential accounts use
    // "local:credential"). Populated on every account create (ADR 0011; BA 1.7 upgrade
    // guide). The generated migration adds it NOT NULL directly — correct for fresh installs
    // and our disposable test/e2e DBs. A deployment that ALREADY holds account rows must
    // instead follow BA's guide (add nullable → backfill → SET NOT NULL) before applying it.
    issuer: text("issuer").notNull(),
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
  (table) => [
    // BA 1.7 identifies an account by (issuer, accountId).
    uniqueIndex("account_issuer_account_id_idx").on(
      table.issuer,
      table.accountId
    ),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
