import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

interface ResetPasswordProps {
  firstName?: string;
  email: string;
  resetUrl: string;
}

export default function ResetPassword({
  firstName = "there",
  email,
  resetUrl,
}: ResetPasswordProps) {
  return (
    <EmailLayout preview="This link expires in 30 minutes.">
      <Heading style={styles.heading}>Reset your password</Heading>
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        We received a request to reset the password for your account ({email}).
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={resetUrl} style={styles.button}>
          Reset password
        </Button>
      </Section>
      <Text style={styles.muted}>
        This link expires in 30 minutes and can only be used once.
      </Text>
      <Text style={styles.muted}>
        If you didn't request a password reset, you can safely ignore this email
        — your password will stay the same.
      </Text>
    </EmailLayout>
  );
}

ResetPassword.PreviewProps = {
  firstName: "Alex",
  email: "alex@example.com",
  resetUrl: "https://example.com/reset?token=preview",
} satisfies ResetPasswordProps;
