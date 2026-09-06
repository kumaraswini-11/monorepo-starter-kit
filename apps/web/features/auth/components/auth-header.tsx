import { Logo } from "@workspace/ui/components/brand/logo";

/**
 * Shared heading block for auth screens — the brand wordmark, the page's real `<h1>`
 * (ADR 0020), and a one-line description. Extracted so every step (entry, email,
 * password, …) uses the same scale and rhythm instead of re-declaring the markup per
 * page and drifting out of sync.
 */
export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Logo className="h-6 w-auto" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
