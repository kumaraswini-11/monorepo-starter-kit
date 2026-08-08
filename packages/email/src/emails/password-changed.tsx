import { Heading, Text } from "@react-email/components";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

interface PasswordChangedProps {
  firstName?: string;
  email: string;
}

export default function PasswordChanged({
  firstName = "there",
  email,
}: PasswordChangedProps) {
  return (
    <EmailLayout preview="If this wasn't you, take action now.">
      <Heading style={styles.heading}>Your password was changed</Heading>
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        The password for your account ({email}) was just changed. If this was
        you, you're all set.
      </Text>
      <Text style={styles.paragraph}>
        If this wasn't you, reset your password immediately and contact support.
        For your security, we've signed you out of other devices.
      </Text>
    </EmailLayout>
  );
}

PasswordChanged.PreviewProps = {
  firstName: "Alex",
  email: "alex@example.com",
} satisfies PasswordChangedProps;
