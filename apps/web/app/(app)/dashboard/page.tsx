import type { Metadata } from "next";

import { Badge } from "@workspace/ui/components/shadcn/badge";
import { Button } from "@workspace/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/shadcn/card";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
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
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>

      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h2 className="font-medium">Project ready!</h2>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </main>
  );
}
