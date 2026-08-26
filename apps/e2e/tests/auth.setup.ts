import { test as setup } from "@playwright/test";

import { signUpViaUi, STORAGE_STATE, uniqueEmail } from "../support/auth.js";

/**
 * Playwright auth "setup" project (ADR 0025): authenticate once and persist the browser context
 * to `STORAGE_STATE`, so the authed projects start already-signed-in instead of re-running the
 * login UI per test — faster and isolates each authed test from the login flow. The authed
 * journeys are read-only, so this one shared session is safe to fan out across them.
 */
setup("authenticate", async ({ page }) => {
  await signUpViaUi(page, uniqueEmail("e2e-setup"));
  await page.context().storageState({ path: STORAGE_STATE });
});
