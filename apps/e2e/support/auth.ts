import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";

/**
 * Where the `setup` project persists an authenticated browser context so the authed projects
 * reuse the session instead of re-logging-in per test (Playwright `storageState`). Git-ignored
 * (`.auth/`) — a real session, never committed. (ADR 0029)
 */
export const STORAGE_STATE = ".auth/user.json";

/** Long enough for Better Auth's `minPasswordLength`; value is irrelevant to the assertions. */
const E2E_PASSWORD = "correct-horse-battery-staple";

/** A fresh, collision-proof address so every run is idempotent — no seeding or cleanup. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

/**
 * Drive the identifier-first sign-up UI to a signed-in dashboard: /auth → email → (new address
 * routes to sign-up) → create account → Better Auth auto-signs-in → /dashboard. Shared by the
 * sign-up journey and the `setup` project so the flow has a single source of truth. Performs the
 * steps only — callers add their own assertions.
 */
export async function signUpViaUi(
  page: Page,
  email: string,
  name = "E2E User"
): Promise<void> {
  await page.goto("/auth");
  await page.getByRole("link", { name: /continue with email/i }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel(/name/i).fill(name);
  // `exact` so we hit the field, not the "Show password" toggle.
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/dashboard$/);
}
