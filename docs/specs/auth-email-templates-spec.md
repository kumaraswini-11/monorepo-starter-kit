# Auth Email Templates — Production Specification

**Version:** 1.0  
**Status:** Production-ready  
**Scope:** Transactional emails for authentication, verification, recovery, and security notifications  
**Tone:** Calm, precise, slightly warm (matches product voice)  
**Design principles:** Single primary CTA • Mobile-first • Scannable • Clear expiry • Security-conscious • No marketing fluff

## Related decisions & stack alignment

Companion to the [Auth UI/UX spec](auth-ui-ux-spec.md): that spec covers the **web
screens**; this one covers the **transactional emails** those flows send. These
templates are implemented per
[ADR 0020](../decisions/0020-email-transactional-messaging.md) as **React Email**
components in `packages/email`, rendered to HTML + plain-text and delivered through the
`sendEmail` port — triggered by Better Auth
([ADR 0016](../decisions/0016-authentication-strategy.md)) callbacks/hooks
(`sendVerificationEmail`, `sendResetPassword`, and session/security events).

**Alignment notes — reconcile at implementation:**

- **Author as React Email** components in `packages/email` (not raw HTML); one
  `render()` yields both the HTML and the plain-text fallback (ADR 0020).
- **Map `[Product]`, colours, and buttons to our design tokens** (shadcn stone theme in
  `globals.css`) — don't hardcode a separate palette. Tone matches the UI spec.
- **Keep copy ↔ config in sync:** the expiry windows below (24h verify, 15–30 min
  reset) are set in Better Auth (`emailVerification` / `emailAndPassword`), not just in
  prose — change them in one place and mirror the other.
- **Provider-agnostic:** delivery follows ADR 0020 (console stub in dev → SES/Resend/
  SMTP later); these templates don't depend on the provider.
- **Security emails** (password-changed, new-device) fire from Better Auth hooks;
  password change must invalidate other sessions (matches §3).

---

## Recommended Email Set

| Priority | Template                       | Trigger                                   | Required             |
| -------- | ------------------------------ | ----------------------------------------- | -------------------- |
| P0       | Welcome + Verify Email         | First-time signup                         | Yes                  |
| P0       | Forgot Password (Magic Link)   | User requests password reset              | Yes                  |
| P1       | Password Changed Confirmation  | After successful password reset           | Strongly recommended |
| P1       | New Sign-in / New Device Alert | Login from unrecognized device/browser    | Recommended          |
| P2       | Account Unlock                 | After rate-limit lock is lifted via email | Nice to have         |
| P2       | Invite Email                   | When a user invites a teammate            | Org feature          |

---

## 1. Welcome + Verify Email (First-time Signup)

**When sent:** Immediately after a new account is created (email or Google path).  
**Goal:** Welcome the user + drive email verification without blocking product access.

### Subject

```
Welcome to [Product] — verify your email
```

### Preheader

```
You’re in. Just one quick step to unlock full access.
```

### Body

```
Hi {{first_name}},

Welcome to [Product]. We’ve created your personal workspace so you can start exploring right away.

To unlock full access and keep your account secure, please verify your email:

[ Verify Email Address ]

This link expires in 24 hours.

You’re already inside the product — verification just removes the banner and enables all features.

If you didn’t create this account, you can safely ignore this email.

—
The [Product] team
```

### Alternative shorter version (leaner)

```
Subject: Verify your email to get started with [Product]

Hi {{first_name}},

Thanks for signing up. Click below to verify your email and remove the verification banner:

[ Verify Email ]

Link expires in 24 hours.

You’re already able to use [Product] while this is pending.

—
The [Product] team
```

### Design Notes

- Primary button: high-contrast, minimum 44px height
- Button text: “Verify Email Address” or “Verify Email”
- Link must be single-use and expire in 24 hours
- Include both HTML button and plain-text fallback link

---

## 2. Forgot Password — Magic Link (Primary Method)

**When sent:** User submits email on the Forgot Password screen.  
**Goal:** Let the user securely set a new password with one click.

### Subject

```
Reset your [Product] password
```

### Preheader

```
This link expires in 30 minutes
```

### Body

```
Hi {{first_name}},

We received a request to reset the password for your [Product] account ({{email}}).

[ Reset Password ]

This link expires in 30 minutes and can only be used once.

If you didn’t request a password reset, you can safely ignore this email — your password will stay the same.

For security, we recommend choosing a strong, unique password.

—
The [Product] team
```

### Optional OTP Fallback Line

(Add when user chooses “Use a code instead” or as secondary option)

```
Prefer to enter a code instead?
Go back to the app and choose “Use a code instead”, or reply to this email.
```

### Design Notes

- Token must be cryptographically secure, single-use, and expire in 15–30 minutes
- After successful reset → invalidate other sessions
- Always send the Password Changed Confirmation email afterwards

---

## 3. Password Changed Confirmation (Strongly Recommended)

**When sent:** Immediately after a password is successfully updated (via reset or settings).  
**Goal:** Confirm the change and alert the real owner if it was unauthorized.

### Subject

```
Your [Product] password was changed
```

### Preheader

```
If this wasn’t you, take action now
```

### Body

```
Hi {{first_name}},

The password for your [Product] account ({{email}}) was just changed.

If this was you — you’re all set.

If this wasn’t you:
• Reset your password immediately
• Contact support

We’ve also signed you out of other devices for security.

—
The [Product] team
```

### Design Notes

- No primary button needed (or optional “Review account activity”)
- Keep tone calm but clear about the security implication
- This email significantly increases user trust

---

## 4. New Sign-in / New Device Alert (Recommended)

**When sent:** Successful login from a new device, browser, or unusual location.  
**Goal:** Surface security awareness without creating panic.

### Subject

```
New sign-in to your [Product] account
```

### Preheader

```
We noticed a sign-in from a new device
```

### Body

```
Hi {{first_name}},

We noticed a new sign-in to your [Product] account.

Device: {{device}}
Location: {{approx_location}}
Time: {{timestamp}}

If this was you, no action is needed.

If you don’t recognize this activity:
• Reset your password immediately
• Review your active sessions in Settings

—
The [Product] team
```

### Design Notes

- Keep location approximate (city/country level) for privacy
- Link to session management page is valuable

---

## 5. Account Unlock (Rate-limit Recovery)

**When sent:** After a user hits rate limits and requests an unlock, or automatically when lock expires.  
**Goal:** Restore access cleanly.

### Subject

```
Your [Product] account has been unlocked
```

### Preheader

```
You can sign in again
```

### Body

```
Hi {{first_name}},

Your [Product] account has been unlocked. You can now sign in again.

[ Sign in to [Product] ]

If you continue to have trouble signing in, reset your password or contact support.

—
The [Product] team
```

---

## Implementation Guidelines

### Technical Requirements

- All links must use HTTPS and signed, time-limited tokens
- Magic links & verification links: single-use + short expiry
- Rate-limit password reset requests (e.g. max 5 per hour per email)
- Always provide a plain-text version of every email
- Use proper `From` name: `"[Product] <noreply@yourdomain.com>"`
- Support dark mode email clients (avoid pure white backgrounds if possible)

### Content & UX Rules

- One primary call-to-action only
- Subject lines under 50 characters when possible
- Preheader should complement (not repeat) the subject
- Never include the actual password
- Never use urgency language that creates panic (“Urgent!”, “Immediate action required!!”)
- Personalize with first name when available; fall back to “Hi there,”

### Accessibility

- Sufficient color contrast on buttons
- Descriptive link text (avoid “Click here”)
- Logical heading structure
- Alt text on any logo/image

### Testing Checklist

- [ ] Gmail (web + mobile)
- [ ] Outlook / Microsoft 365
- [ ] Apple Mail
- [ ] Superhuman / other modern clients
- [ ] Dark mode rendering
- [ ] Plain-text fallback
- [ ] Link expiry works correctly
- [ ] Token cannot be reused

---

## Variable Reference

| Variable              | Description                       | Example                    |
| --------------------- | --------------------------------- | -------------------------- |
| `{{first_name}}`      | User’s first name or display name | Alex                       |
| `{{email}}`           | User’s email address              | alex@company.com           |
| `{{device}}`          | Browser + OS                      | Chrome on macOS            |
| `{{approx_location}}` | City / Country level              | San Francisco, US          |
| `{{timestamp}}`       | Localized date & time             | Aug 8, 2026 at 7:12 PM IST |

---

**End of Email Templates Specification**

These templates are ready for implementation. They follow current best practices for
security, conversion, and user trust in B2B authentication flows.
