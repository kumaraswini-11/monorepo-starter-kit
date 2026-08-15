import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

/**
 * Root dispatcher. Routes the visitor by auth state instead of rendering UI: a signed-in
 * user goes to the app, everyone else to the auth entry. This keeps `/` free for a future
 * marketing home and centralizes the "where do I land?" decision.
 *
 * It reads the session, so it renders per-request (`instant = false`, Cache Components /
 * ADR 0023) — there is no static shell to lose, the page only redirects.
 */
export const instant = false;

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/auth");
}
