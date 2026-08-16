import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@workspace/ui/components/shadcn/button";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Back link shared by the auth steps. `-ms-1.5` cancels the ghost button's start padding
 * so the arrow sits on the same left axis as the wordmark/heading below it. The arrow is
 * decorative (the visible "Back" label is the accessible name), so it is `aria-hidden`
 * (ADR 0024 §6).
 */
export function AuthBackLink({
  href,
  children = "Back",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ms-1.5 self-start text-muted-foreground"
      )}
    >
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
      {children}
    </Link>
  );
}
