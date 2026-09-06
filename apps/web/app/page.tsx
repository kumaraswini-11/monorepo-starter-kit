import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

/**
 * Root dispatcher. Routes the visitor by auth state instead of rendering UI: a signed-in
 * user goes to the app, everyone else to the auth entry. This keeps `/` free for a future
 * marketing home and centralizes the "where do I land?" decision.
 *
 * It reads the session (`headers()`), so it's dynamic with no static shell — it only
 * redirects. `instant = false` opts this segment out of instant-navigation validation
 * (Cache Components / ADR 0019), acknowledging the intentional server-blocking read.
 */
export const instant = false;

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/auth");
}
