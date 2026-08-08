import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

interface AccountUnlockedProps {
  firstName?: string;
  signInUrl: string;
}

export default function AccountUnlocked({
  firstName = "there",
  signInUrl,
}: AccountUnlockedProps) {
  return (
    <EmailLayout preview="You can sign in again.">
      <Heading style={styles.heading}>Your account has been unlocked</Heading>
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        Your account has been unlocked. You can sign in again.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={signInUrl} style={styles.button}>
          Sign in
        </Button>
      </Section>
      <Text style={styles.muted}>
        If you continue to have trouble signing in, reset your password or
        contact support.
      </Text>
    </EmailLayout>
  );
}

AccountUnlocked.PreviewProps = {
  firstName: "Alex",
  signInUrl: "https://example.com/sign-in",
} satisfies AccountUnlockedProps;
