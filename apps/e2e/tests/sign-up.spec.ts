import { expect, test } from "@playwright/test";

import { signUpViaUi, uniqueEmail } from "../support/auth.js";

/**
 * Full sign-up journey against the real app + Postgres (ADR 0025): a never-seen email routes
 * through the identifier-first flow to account creation and auto-login. Runs in the public
 * project (no stored session) — a genuine first-time visitor.
 */
test("signing up with a new email lands on the dashboard", async ({ page }) => {
  await signUpViaUi(page, uniqueEmail());

  // Better Auth auto-signs-in on sign-up → the authed dashboard.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
