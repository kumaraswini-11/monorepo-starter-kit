import { expect, test } from "@playwright/test";

import {
  E2E_PASSWORD,
  signOutViaUi,
  signUpViaUi,
  uniqueEmail,
} from "../support/auth.js";

/**
 * Returning-user credentials sign-in journey (ADR 0025 §2). The storageState path proves session
 * *reuse*, not the sign-in form — so this drives the real thing: create an account, sign out, then
 * come back through the identifier-first flow where an existing email routes to the password step.
 * Runs in the public project with its own fresh user, so it's isolated and idempotent.
 */
test("a returning user signs in with email + password", async ({ page }) => {
  const email = uniqueEmail("e2e-signin");

  // Arrange: create the account (auto-signed-in), then sign out so we start signed-out.
  await signUpViaUi(page, email);
  await signOutViaUi(page);
  await expect(page).toHaveURL(/\/auth$/);

  // Act: start the flow fresh — a full load resets the in-memory auth-flow state ("restart,
  // don't resume"), so the email step is editable rather than carrying over the just-used
  // address from the sign-up above.
  await page.goto("/auth/email");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  // An existing email routes to the sign-in (password) step, not sign-up.

  // `exact` so we hit the field, not the "Show password" toggle.
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
