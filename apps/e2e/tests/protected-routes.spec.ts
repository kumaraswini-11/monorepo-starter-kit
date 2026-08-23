import { expect, test } from "@playwright/test";

/**
 * The authed-area guard ((app)/layout.tsx) redirects unauthenticated requests to /auth before
 * any protected UI renders (ADR 0027). With no session cookie, Better Auth resolves no session
 * without a DB round-trip, so this journey needs no seeded database — just the running app.
 */
test("unauthenticated access to a protected route redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/auth$/);
  await expect(
    page.getByRole("heading", { name: "Sign in or create an account" })
  ).toBeVisible();
});
