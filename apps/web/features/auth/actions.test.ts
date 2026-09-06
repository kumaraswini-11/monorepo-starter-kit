import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { FormSubmitError } from "@workspace/ui/components/form/form-submit";

/**
 * Seam contract tests (ADR 0025 §9). The seam (`actions.ts`) is the ONLY module that talks to
 * the Better Auth transport, so we exercise it through **real HTTP** intercepted by MSW —
 * never by mocking `authClient` internals. That pins the transport contract (which HTTP status
 * maps to which user-safe error) and makes these tests survive the ADR 0017 backend split
 * unchanged: only the client's baseURL moves, and the handlers already match any origin.
 *
 * Ordering matters: Better Auth's client snapshots `globalThis.fetch` into `customFetchImpl`
 * when it's constructed (at module import). So we start MSW (which patches `fetch`) BEFORE
 * importing the seam — hence the dynamic import below — so the client captures the intercepted
 * fetch. Handlers use a leading wildcard to match whatever origin the same-origin client
 * resolves at runtime (the jsdom URL), rather than coupling to it.
 */
const server = setupServer();
server.listen({ onUnhandledRequest: "error" });

const { resolveAuthRoute, signInWithEmail, signInWithGoogle, signUpWithEmail } =
  await import("./actions");

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("auth seam — identifier routing", () => {
  it("routes a known email to sign-in", async () => {
    server.use(
      http.post("*/api/auth/account-exists", () =>
        HttpResponse.json({ exists: true })
      )
    );
    await expect(resolveAuthRoute("known@example.com")).resolves.toBe(
      "sign-in"
    );
  });

  it("routes an unknown email to sign-up", async () => {
    server.use(
      http.post("*/api/auth/account-exists", () =>
        HttpResponse.json({ exists: false })
      )
    );
    await expect(resolveAuthRoute("new@example.com")).resolves.toBe("sign-up");
  });

  it("maps a 429 to the rate-limit message (enumeration guard)", async () => {
    server.use(
      http.post("*/api/auth/account-exists", () =>
        HttpResponse.json({ message: "rate limited" }, { status: 429 })
      )
    );
    await expect(resolveAuthRoute("known@example.com")).rejects.toThrow(
      /too many attempts/i
    );
  });
});

describe("auth seam — sign-in", () => {
  it("resolves on success", async () => {
    server.use(
      http.post("*/api/auth/sign-in/email", () =>
        HttpResponse.json({ user: { id: "u1" } })
      )
    );
    await expect(
      signInWithEmail("known@example.com", "correct-password")
    ).resolves.toBeUndefined();
  });

  it("maps any credential failure to one generic, enumeration-safe error", async () => {
    server.use(
      http.post("*/api/auth/sign-in/email", () =>
        HttpResponse.json({ message: "nope" }, { status: 401 })
      )
    );
    const error = await signInWithEmail(
      "known@example.com",
      "wrong-password"
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(FormSubmitError);
    expect((error as FormSubmitError).message).toBe(
      "Invalid email or password."
    );
  });
});

describe("auth seam — sign-up", () => {
  it("maps a 422 race to the already-exists hint", async () => {
    server.use(
      http.post("*/api/auth/sign-up/email", () =>
        HttpResponse.json({ message: "exists" }, { status: 422 })
      )
    );
    await expect(
      signUpWithEmail({ email: "taken@example.com", password: "a-password-10" })
    ).rejects.toThrow(/already exists/i);
  });

  it("maps other failures to the generic sign-up error", async () => {
    server.use(
      http.post("*/api/auth/sign-up/email", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );
    await expect(
      signUpWithEmail({ email: "new@example.com", password: "a-password-10" })
    ).rejects.toThrow(/could not create your account/i);
  });
});

describe("auth seam — google", () => {
  it("maps a failed social sign-in to a user-safe error", async () => {
    server.use(
      http.post("*/api/auth/sign-in/social", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 })
      )
    );
    await expect(signInWithGoogle()).rejects.toThrow(/google sign-in/i);
  });
});
