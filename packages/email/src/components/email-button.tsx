import type { ReactNode } from "react";
import { Button, Section } from "react-email";

import { styles } from "@workspace/email/components/email-layout";

/**
 * The shared call-to-action button for auth emails (ADR 0014) — one `Section` wrapper + the branded
 * button style, so every email's primary action looks and spaces identically.
 */
export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Button href={href} style={styles.button}>
        {children}
      </Button>
    </Section>
  );
}
