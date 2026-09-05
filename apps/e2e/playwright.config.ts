import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE } from "./support/auth.js";
import { DEFAULT_DATABASE_URL } from "./support/db.js";

/**
 * End-to-end tests for apps/web (ADR 0025). A dedicated workspace so `@playwright/test` +
 * browsers never enter the app bundle. Runs against the production build (`next start`) for
 * realistic behavior; `turbo test:e2e` builds `web` first (`dependsOn: ["^build"]`).
 */
const CI = !!process.env.CI;
const PORT = 3100; // off the default 3000 so a running dev server doesn't clash
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  // Better Auth's scrypt hashing is synchronous and blocks the single `next start` event loop,
  // so concurrent sign-ups serialize on the server anyway — parallelism buys no speed and only
  // risks navigation timeouts under load. Run serially locally; cap CI (cleaner runners +
  // retries below absorb the rest). (playwright-best-practices)
  workers: CI ? "50%" : 1,
  // `github` = inline PR annotations; `list` = console. Switch to `blob` + a merge job if/when
  // we shard (blob alone, unmerged, isn't useful).
  reporter: CI ? [["github"], ["list"]] : "list",
  // Generous because auth journeys pay for real server-side scrypt (deliberately slow) + a DB
  // round-trip + redirect; navigation must stay under the per-test budget.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Apply Drizzle migrations to the e2e Postgres before the app starts (ADR 0025).
  globalSetup: "./global-setup.ts",
  use: {
    baseURL,
    // Bound action/navigation waits so a hung step fails fast instead of stalling to the
    // global timeout (default actionTimeout is unbounded). navigation is generous for the
    // scrypt-backed auth redirects above. (playwright-best-practices)
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // An ARRAY from day one: when the backend splits out (ADR 0017) it becomes a second entry
  // here, and the e2e suite boots both services unchanged.
  webServer: [
    {
      command: `pnpm --filter web start --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: !CI,
      timeout: 120_000,
      // Real Postgres for DB-backed journeys (sign-up hits the DB). `DATABASE_URL` is the
      // docker-compose Postgres locally / a Postgres service in CI (defaulted to the compose
      // creds); global-setup migrates it first. Throwaway auth secret — e2e signs up fresh users.
      env: {
        DATABASE_URL: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ??
          "e2e-secret-at-least-32-characters-long-00",
        BETTER_AUTH_URL: baseURL,
      },
    },
  ],
  projects: [
    // Authenticate once; the authed project reuses the saved session (storageState).
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      // First-time-visitor journeys (sign-up, sign-out, redirects) — no stored session.
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.authed\.spec\.ts$/,
    },
    {
      // Returning-authenticated journeys — start signed-in from the setup project's session.
      name: "chromium-authed",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
      testMatch: /\.authed\.spec\.ts$/,
    },
  ],
});
