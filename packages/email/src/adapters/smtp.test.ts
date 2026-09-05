import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for the Nodemailer/SMTP adapter (ADR 0014). Nodemailer + the env are mocked, so
 * these assert the adapter's own contract — the official-docs behaviors we rely on: a pooled,
 * hardened transporter; TLS-by-port (465 implicit, 587 STARTTLS) with an explicit override; the
 * `EmailMessage → sendMail` mapping incl. the `EMAIL_FROM` default; transporter reuse; and the
 * fail-fast error paths.
 */

// Hoisted so the vi.mock factories below can reference them (vi.mock is hoisted above imports).
const { sendMail, createTransport, state } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    sendMail,
    createTransport: vi.fn(() => ({ sendMail })),
    // Mutable env read through a getter, so each test supplies its own values.
    state: { env: {} as Record<string, unknown> },
  };
});

vi.mock("nodemailer", () => ({
  default: { createTransport },
  createTransport,
}));
vi.mock("@workspace/env", () => ({
  get env() {
    return state.env;
  },
}));

const BASE_ENV = {
  SMTP_HOST: "smtp.resend.com",
  SMTP_PORT: 465,
  SMTP_USER: "resend",
  SMTP_PASSWORD: "re_test_key",
  EMAIL_FROM: "efferd <noreply@efferd.test>",
  SMTP_SECURE: undefined as boolean | undefined,
};

const MESSAGE = {
  to: "ada@example.com",
  subject: "Verify your email",
  html: "<p>Hello</p>",
  text: "Hello",
};

/** Fresh module (so the transporter singleton resets) with the current mock env. */
async function loadAdapter() {
  vi.resetModules();
  const { smtpEmailAdapter } = await import("@workspace/email/adapters/smtp");
  return smtpEmailAdapter;
}

beforeEach(() => {
  vi.clearAllMocks();
  sendMail.mockResolvedValue({ messageId: "test" });
  state.env = { ...BASE_ENV };
});

describe("smtpEmailAdapter", () => {
  it("builds a pooled, hardened transporter with implicit TLS on port 465", async () => {
    const send = await loadAdapter();
    await send(MESSAGE);

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: { user: "resend", pass: "re_test_key" },
        pool: true,
        disableFileAccess: true,
        disableUrlAccess: true,
      })
    );
  });

  it("uses STARTTLS (secure: false) on port 587", async () => {
    state.env = { ...BASE_ENV, SMTP_PORT: 587 };
    const send = await loadAdapter();
    await send(MESSAGE);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false })
    );
  });

  it("honors an explicit SMTP_SECURE override", async () => {
    state.env = { ...BASE_ENV, SMTP_PORT: 587, SMTP_SECURE: true };
    const send = await loadAdapter();
    await send(MESSAGE);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: true })
    );
  });

  it("maps the message and defaults From to EMAIL_FROM", async () => {
    const send = await loadAdapter();
    await send({ ...MESSAGE, replyTo: "support@efferd.test" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "efferd <noreply@efferd.test>",
        to: "ada@example.com",
        subject: "Verify your email",
        html: "<p>Hello</p>",
        text: "Hello",
        replyTo: "support@efferd.test",
      })
    );
  });

  it("lets a per-message From override the default", async () => {
    const send = await loadAdapter();
    await send({ ...MESSAGE, from: "billing@efferd.test" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "billing@efferd.test" })
    );
  });

  it("reuses one pooled transporter across sends", async () => {
    const send = await loadAdapter();
    await send(MESSAGE);
    await send(MESSAGE);

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it("throws when no From is available", async () => {
    state.env = { ...BASE_ENV, EMAIL_FROM: undefined };
    const send = await loadAdapter();

    await expect(send(MESSAGE)).rejects.toThrow(/from address/i);
  });

  it("throws when SMTP credentials are incomplete", async () => {
    state.env = { ...BASE_ENV, SMTP_PASSWORD: undefined };
    const send = await loadAdapter();

    await expect(send(MESSAGE)).rejects.toThrow(/SMTP/i);
  });
});
