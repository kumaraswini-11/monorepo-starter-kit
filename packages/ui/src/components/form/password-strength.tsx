"use client";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Live password-strength hint for new-password fields (sign-up / reset / change-password).
 * A deliberately light heuristic (length + character variety) — real-user feedback, not a
 * security control; the actual policy is enforced server-side. No zxcvbn dependency for a
 * UI cue. Generic (not auth-specific) — lives in `components/form/` with the field layer.
 */
const LEVELS = [
  { label: "Weak", bar: "bg-destructive" },
  { label: "Fair", bar: "bg-amber-500" },
  { label: "Good", bar: "bg-amber-500" },
  { label: "Strong", bar: "bg-emerald-500" },
] as const;

/** 0–3, mapping to the four `LEVELS`. */
function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 10) score++;
  if (value.length >= 14) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(score, LEVELS.length - 1);
}

export function PasswordStrength({ password }: { password: string }) {
  const score = password ? scorePassword(password) : -1;
  const level = score >= 0 ? LEVELS[score]! : null;

  return (
    <>
      {/*
       * Always-mounted polite live region so the FIRST strength change is announced — a
       * region that appears already-populated is often skipped by screen readers. The
       * visual bars are decorative (`aria-hidden`); this text is the accessible source.
       */}
      <span className="sr-only" role="status">
        {level ? `Password strength: ${level.label}` : ""}
      </span>
      {level ? (
        <div className="flex items-center gap-2" aria-hidden="true">
          <div className="flex flex-1 gap-1">
            {LEVELS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  index <= score ? level.bar : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="w-10 text-xs text-muted-foreground">
            {level.label}
          </span>
        </div>
      ) : null}
    </>
  );
}
