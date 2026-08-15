import type { ReactNode } from "react";

/**
 * Shell for the auth screens (see ADR 0024). Layout conventions (codebase-wide):
 * - `min-h-svh` (small-viewport-height) so mobile browser chrome never clips content.
 * - Native document scroll — NO `overflow-hidden` — so it still works when content
 *   exceeds the viewport (zoom, short screens, long error states, translations).
 * - Flex-centered content in a capped `max-w-sm` column; responsive padding.
 * - `relative` wrapper reserves a slot for a later decorative background layer
 *   (absolute, `-z-10`, `aria-hidden`, `prefers-reduced-motion`-guarded).
 *
 * No global back/Home link: the auth entry is the app's first screen (nothing to
 * return to). Inter-screen navigation (Back to entry, Sign in ↔ Sign up) lives in
 * the individual screens.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
