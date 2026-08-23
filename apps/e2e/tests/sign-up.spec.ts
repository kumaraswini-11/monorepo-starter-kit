import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Full sign-up journey against the real app + Postgres (ADR 0029): identifier-first flow
 * (/auth → email → new address routes to sign-up → create account → auto-login → /dashboard).
 * A unique email per run keeps it idempotent, so no seeding or cleanup is needed.
 */
test("signing up with a new email lands on the dashboard", async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.com`;

  await page.goto("/auth");
  await page.getByRole("link", { name: /continue with email/i }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  // A never-seen email routes to the sign-up step.
  await page.getByLabel(/name/i).fill("E2E User");
  // `exact` so we hit the field, not the "Show password" toggle.
  await page
    .getByLabel("Password", { exact: true })
    .fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Create account" }).click();

  // Better Auth auto-signs-in on sign-up → the authed dashboard.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
