import { Heading, Section, Text } from "react-email";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

interface NewDeviceProps {
  firstName?: string;
  device: string;
  location: string;
  timestamp: string;
}

export default function NewDevice({
  firstName = "there",
  device,
  location,
  timestamp,
}: NewDeviceProps) {
  return (
    <EmailLayout preview="We noticed a sign-in from a new device.">
      <Heading style={styles.heading}>New sign-in to your account</Heading>
      <Text style={styles.paragraph}>Hi {firstName},</Text>
      <Text style={styles.paragraph}>
        We noticed a new sign-in to your account.
      </Text>
      <Section style={{ margin: "0 0 16px" }}>
        <Text style={styles.muted}>Device: {device}</Text>
        <Text style={styles.muted}>Location: {location}</Text>
        <Text style={styles.muted}>Time: {timestamp}</Text>
      </Section>
      <Text style={styles.paragraph}>
        If this was you, no action is needed. If you don't recognize this
        activity, reset your password immediately and review your active
        sessions in Settings.
      </Text>
    </EmailLayout>
  );
}

NewDevice.PreviewProps = {
  firstName: "Alex",
  device: "Chrome on macOS",
  location: "San Francisco, US",
  timestamp: "Aug 8, 2026 at 7:12 PM",
} satisfies NewDeviceProps;
