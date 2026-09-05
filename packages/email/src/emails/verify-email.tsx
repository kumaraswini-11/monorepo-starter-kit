import { Button, Heading, Section, Text } from "react-email";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

interface VerifyEmailProps {
  firstName?: string;
  verifyUrl: string;
}

export default function VerifyEmail({
  firstName = "there",
  verifyUrl,
}: VerifyEmailProps) {
  return (
    <EmailLayout preview="You're in. Just one quick step to unlock full access.">
      <Heading style={styles.heading}>Welcome — verify your email</Heading>
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        We've created your personal workspace so you can start exploring right
        away. To unlock full access and keep your account secure, please verify
        your email.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={verifyUrl} style={styles.button}>
          Verify email address
        </Button>
      </Section>
      <Text style={styles.muted}>This link expires in 24 hours.</Text>
      <Text style={styles.muted}>
        You're already inside the product — verification just removes the banner
        and enables all features. If you didn't create this account, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  firstName: "Alex",
  verifyUrl: "https://example.com/verify?token=preview",
} satisfies VerifyEmailProps;
