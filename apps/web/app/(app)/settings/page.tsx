import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

/**
 * Settings — placeholder for now (the real surface lands in a later phase; ADR 0016 roadmap).
 * Reachable from the sidebar so the navigation is complete; content is intentionally empty.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      <div className="mt-6 flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
