import type { ReactElement } from "react";
import { render } from "@react-email/render";

/**
 * Render a React Email template to the { html, text } pair the `sendEmail` port
 * expects (ADR 0020). Output is plain strings, so it stays provider-agnostic.
 */
export async function renderEmail(
  element: ReactElement
): Promise<{ html: string; text: string }> {
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}
