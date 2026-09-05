import type { ReactNode } from "react";

import { AuthFlowProvider } from "@/components/auth/auth-flow-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Shell for the auth screens under `/auth/*` (see ADR 0020). Layout conventions
 * (codebase-wide):
 * - `min-h-svh` (small-viewport-height) so mobile browser chrome never clips content.
 * - Native document scroll — NO `overflow-hidden` — so it still works when content
 *   exceeds the viewport (zoom, short screens, long error states, translations).
 * - Flex-centered content in a capped `max-w-md` column; responsive padding.
 * - `relative` wrapper reserves a slot for a later decorative background layer
 *   (absolute, `-z-10`, `aria-hidden`, `prefers-reduced-motion`-guarded).
 *
 * No global back/Home link: `/` dispatches visitors to `/auth`, so the entry is the
 * first screen. Inter-screen navigation (Back, Sign in ↔ Sign up) lives in each screen.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <div className="absolute end-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <AuthFlowProvider>{children}</AuthFlowProvider>
        </div>
      </main>
    </div>
  );
}
