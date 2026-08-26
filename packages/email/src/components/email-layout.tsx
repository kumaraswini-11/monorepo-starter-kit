import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

/**
 * Shared shell for every auth email (ADR 0014). Styles are inline — email clients
 * don't reliably support external CSS — and map to the app's stone/neutral palette
 * so the emails read as part of the product.
 */

// TODO: swap for the real product name (or wire from config) when branding lands.
export const PRODUCT_NAME = "Acme";

const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const styles = {
  body: {
    backgroundColor: "#f5f5f4",
    fontFamily,
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "440px",
    padding: "32px",
  },
  brand: {
    color: "#1c1917",
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 24px",
  },
  heading: {
    color: "#1c1917",
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  paragraph: {
    color: "#292524",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  muted: {
    color: "#57534e",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 12px",
  },
  button: {
    backgroundColor: "#1c1917",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
  hr: { borderColor: "#e7e5e4", margin: "24px 0 16px" },
  footer: { color: "#79716b", fontSize: "12px", margin: 0 },
} satisfies Record<string, CSSProperties>;

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>{PRODUCT_NAME}</Text>
          {children}
          <Hr style={styles.hr} />
          <Text style={styles.footer}>The {PRODUCT_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
}
