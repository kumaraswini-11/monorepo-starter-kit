import { expect, test } from "@playwright/test";

/**
 * Returning-authenticated journey (ADR 0025): a user with a persisted session (the `storageState`
 * from the `setup` project) reaches a protected route directly — no login step. Read-only, so it
 * never mutates the shared session. The inverse (no session → redirect) is covered by
 * `protected-routes.spec.ts`.
 */
test("a returning authenticated user opens the dashboard directly", async ({
  page,
}) => {
  await page.goto("/dashboard");

  // Not bounced to /auth, and the authed shell renders (the account menu holds sign-out).
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Account menu" })
  ).toBeVisible();
});
