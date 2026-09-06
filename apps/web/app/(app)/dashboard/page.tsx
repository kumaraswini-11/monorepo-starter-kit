import type { Metadata } from "next";

import { Badge } from "@workspace/ui/components/shadcn/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/shadcn/card";
import { firstWord } from "@workspace/utils/string";

import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Dashboard — the authed landing page. Rendered inside the app shell (see the `(app)` layout),
 * so it's a normal content pane: the global controls (search, notifications, and the account menu —
 * which holds the theme control and sign-out) live in the shell header, not here.
 */
export default async function DashboardPage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Welcome{user?.name ? `, ${firstWord(user.name) ?? user.name}` : ""}
            {user?.emailVerified ? (
              <Badge variant="secondary">Verified</Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
          </CardTitle>
          <CardDescription>
            You&apos;re signed in as {user?.email}.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
