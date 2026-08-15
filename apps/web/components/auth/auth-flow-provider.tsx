"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthMode = "sign-in" | "sign-up";

type AuthFlow = {
  /** Email captured at `/auth/email`, carried to `/auth/password`. Empty until set. */
  email: string;
  /**
   * Which credential step to show. Set by the email step's existence check once the
   * backend is wired; until then it defaults to sign-in and the password screen offers a
   * manual switch so both paths are reviewable.
   */
  mode: AuthMode;
  setEmail: (email: string) => void;
  setMode: (mode: AuthMode) => void;
};

const AuthFlowContext = createContext<AuthFlow | null>(null);

/**
 * Holds the in-flight auth-flow state (email + credential mode) in memory, so it never
 * touches the URL — no PII in logs / history / `Referer` (ADR 0025 §4). Mounted in the
 * `/auth` layout, so the value persists across the `/auth/email → /auth/password` client
 * navigation but resets on a full reload — the intended "restart, don't resume" behaviour
 * for credential entry.
 */
export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <AuthFlowContext.Provider value={{ email, mode, setEmail, setMode }}>
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
