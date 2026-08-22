"use client";

import { cn } from "@workspace/ui/lib/utils";

/**
 * Live password-strength hint for new-password fields (sign-up / reset / change-password).
 * A deliberately light heuristic (length + character variety) — real-user feedback, not a
 * security control; the actual policy is enforced server-side. No zxcvbn dependency for a
 * UI cue. Generic (not auth-specific) — lives in `components/form/` with the field layer.
 */
// Semantic status hues (red → amber → green), not the neutral chart-* ramp — so the
// levels are actually distinguishable. Good and Strong share green, differentiated by
// how many bars fill (3 vs 4) plus the text label.
const LEVELS = [
  { label: "Weak", bar: "bg-destructive" },
  { label: "Fair", bar: "bg-warning" },
  { label: "Good", bar: "bg-success" },
  { label: "Strong", bar: "bg-success" },
] as const;

// Hoisted so they're compiled once, not rebuilt on every keystroke.
const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SYMBOL = /[^a-zA-Z0-9]/;

/** 0–3, mapping to the four `LEVELS`. */
function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 10) score++;
  if (value.length >= 14) score++;
  if (HAS_LOWER.test(value) && HAS_UPPER.test(value)) score++;
  if (HAS_DIGIT.test(value) && HAS_SYMBOL.test(value)) score++;
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
