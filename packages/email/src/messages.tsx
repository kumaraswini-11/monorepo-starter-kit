import { PRODUCT_NAME } from "@workspace/email/components/email-layout";
import AccountUnlocked from "@workspace/email/emails/account-unlocked";
import Invite from "@workspace/email/emails/invite";
import NewDevice from "@workspace/email/emails/new-device";
import PasswordChanged from "@workspace/email/emails/password-changed";
import ResetPassword from "@workspace/email/emails/reset-password";
import VerifyEmail from "@workspace/email/emails/verify-email";
import { renderEmail } from "@workspace/email/render";
import { sendEmail } from "@workspace/email/send-email";

/**
 * Semantic senders — the ONLY email surface `packages/auth` (and future callers)
 * touch. Each renders a React Email template, applies the subject, and hands the
 * `{ html, text }` off to the swappable `sendEmail` port (ADR 0020). Consumers never
 * import React Email or a transport, so `packages/email` stays the single email
 * choke-point (same one-way boundary as `packages/db`).
 *
 * Subjects mirror the templates spec (`docs/specs/auth-email-templates-spec.md`) and
 * use `PRODUCT_NAME`, so branding + copy change in one place.
 */

export async function sendVerifyEmail(params: {
  to: string;
  firstName?: string;
  verifyUrl: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <VerifyEmail firstName={params.firstName} verifyUrl={params.verifyUrl} />
  );
  await sendEmail({
    to: params.to,
    subject: `Welcome to ${PRODUCT_NAME} — verify your email`,
    html,
    text,
  });
}

export async function sendResetPasswordEmail(params: {
  to: string;
  firstName?: string;
  email: string;
  resetUrl: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <ResetPassword
      firstName={params.firstName}
      email={params.email}
      resetUrl={params.resetUrl}
    />
  );
  await sendEmail({
    to: params.to,
    subject: `Reset your ${PRODUCT_NAME} password`,
    html,
    text,
  });
}

export async function sendPasswordChangedEmail(params: {
  to: string;
  firstName?: string;
  email: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <PasswordChanged firstName={params.firstName} email={params.email} />
  );
  await sendEmail({
    to: params.to,
    subject: `Your ${PRODUCT_NAME} password was changed`,
    html,
    text,
  });
}

export async function sendNewDeviceEmail(params: {
  to: string;
  firstName?: string;
  device: string;
  location: string;
  timestamp: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <NewDevice
      firstName={params.firstName}
      device={params.device}
      location={params.location}
      timestamp={params.timestamp}
    />
  );
  await sendEmail({
    to: params.to,
    subject: `New sign-in to your ${PRODUCT_NAME} account`,
    html,
    text,
  });
}

export async function sendAccountUnlockedEmail(params: {
  to: string;
  firstName?: string;
  signInUrl: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <AccountUnlocked
      firstName={params.firstName}
      signInUrl={params.signInUrl}
    />
  );
  await sendEmail({
    to: params.to,
    subject: `Your ${PRODUCT_NAME} account has been unlocked`,
    html,
    text,
  });
}

export async function sendInviteEmail(params: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
}): Promise<void> {
  const { html, text } = await renderEmail(
    <Invite
      inviterName={params.inviterName}
      organizationName={params.organizationName}
      inviteUrl={params.inviteUrl}
    />
  );
  await sendEmail({
    to: params.to,
    subject: `${params.inviterName} invited you to ${params.organizationName} on ${PRODUCT_NAME}`,
    html,
    text,
  });
}
