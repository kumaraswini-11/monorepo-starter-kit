import { Button, Heading, Section, Text } from "react-email";

import { EmailLayout, styles } from "@workspace/email/components/email-layout";

/**
 * P2, org feature. Copy is provisional — the organization flow (Better Auth
 * organization plugin, auth Phase 6) isn't built yet, so this has no spec body
 * beyond the templates-spec table row. Previewable now; finalize + wire when orgs
 * land (props here will map to the plugin's invitation payload).
 */
interface InviteProps {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
}

export default function Invite({
  inviterName,
  organizationName,
  inviteUrl,
}: InviteProps) {
  return (
    <EmailLayout
      preview={`${inviterName} invited you to join ${organizationName}.`}
    >
      <Heading style={styles.heading}>
        You've been invited to {organizationName}
      </Heading>
      <Text style={styles.paragraph}>
        {inviterName} has invited you to join {organizationName}.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={inviteUrl} style={styles.button}>
          Accept invitation
        </Button>
      </Section>
      <Text style={styles.muted}>
        If you weren't expecting this invitation, you can safely ignore this
        email.
      </Text>
    </EmailLayout>
  );
}

Invite.PreviewProps = {
  inviterName: "Alex Rivera",
  organizationName: "Acme",
  inviteUrl: "https://example.com/invite?token=preview",
} satisfies InviteProps;
