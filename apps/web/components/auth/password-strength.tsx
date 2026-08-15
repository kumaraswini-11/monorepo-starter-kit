"use client";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Live password-strength hint for the sign-up path (spec §3.3/§5). Deliberately a light
 * heuristic (length + character variety) — real-user feedback, not a security control;
 * the actual policy is enforced server-side. No zxcvbn dependency for a UI cue.
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
  if (!password) {
    return null;
  }

  const score = scorePassword(password);
  const level = LEVELS[score]!;

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
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
      <span className="w-10 text-xs text-muted-foreground">{level.label}</span>
    </div>
  );
}
