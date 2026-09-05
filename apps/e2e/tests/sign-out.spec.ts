import { expect, test } from "@playwright/test";

import { signOutViaUi, signUpViaUi, uniqueEmail } from "../support/auth.js";

/**
 * Sign-out journey (ADR 0025). Runs in the public project with its own fresh user so it never
 * touches the shared `storageState` session. Signing out must both leave the app AND actually
 * revoke the session — proven by the protected route bouncing afterwards.
 */
test("signing out clears the session and re-protects the app", async ({
  page,
}) => {
  await signUpViaUi(page, uniqueEmail("e2e-signout"));

  await signOutViaUi(page);
  await expect(page).toHaveURL(/\/auth$/);

  // The session is gone server-side, so a protected route redirects to sign-in.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth$/);
});
