import { expect, test } from "@playwright/test";

/**
 * Smoke test: the app boots (prod build) and the static auth entry page renders its method
 * chooser. Needs no DB (the page is a static Server Component), so it proves the whole e2e
 * harness — workspace, config, webServer, real browser — end to end. The Google button renders
 * only when the provider is configured; the harness supplies placeholder credentials for it.
 */
test("auth entry page renders the sign-in options", async ({ page }) => {
  await page.goto("/auth");

  await expect(
    page.getByRole("heading", { name: "Sign in or create an account" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue with google/i })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /continue with email/i })
  ).toBeVisible();
});
