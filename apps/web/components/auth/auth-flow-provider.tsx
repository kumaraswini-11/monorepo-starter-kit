"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AuthFlow = {
  /** Email captured at `/auth/email`, carried to `/auth/password`. Empty until set. */
  email: string;
  setEmail: (email: string) => void;
};

const AuthFlowContext = createContext<AuthFlow | null>(null);

/**
 * Holds the in-flight auth-flow state (currently just the email) in memory, so it never
 * touches the URL — no PII in logs / history / `Referer` (ADR 0025 §4). Mounted in the
 * `/auth` layout, so the value persists across the `/auth/email → /auth/password` client
 * navigation but resets on a full reload — the intended "restart, don't resume" behaviour
 * for credential entry.
 */
export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");

  return (
    <AuthFlowContext.Provider value={{ email, setEmail }}>
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow(): AuthFlow {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error("useAuthFlow must be used within <AuthFlowProvider>.");
  }
  return context;
}
