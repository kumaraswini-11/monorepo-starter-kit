"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthFlow = {
  /** Email captured at `/auth/email`, carried to the credential step. Empty until set. */
  email: string;
  setEmail: (email: string) => void;
};

const AuthFlowContext = createContext<AuthFlow | null>(null);

/**
 * Holds the in-flight auth-flow state (the email) in memory, so it never touches the URL —
 * no PII in logs / history / `Referer` (ADR 0023 §4). Mounted in the `/auth` layout, so it
 * persists across the `/auth/email → /auth/sign-in|sign-up` client navigation but resets
 * on a full reload — the intended "restart, don't resume" behaviour for credential entry.
 *
 * Sign-in vs sign-up is a route (`/auth/sign-in` / `/auth/sign-up`), decided by the email
 * step's existence check — not a stored mode (identifier-first; spec §2).
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

/**
 * Guard for the credential steps: returns the captured email, or redirects to
 * `/auth/email` when it's missing (refresh / bookmark / direct nav — restart, don't
 * resume). Returns `null` while redirecting so the caller renders nothing.
 */
export function useRequiredEmail(): string | null {
  const router = useRouter();
  const { email } = useAuthFlow();

  useEffect(() => {
    if (!email) {
      router.replace("/auth/email");
    }
  }, [email, router]);

  return email || null;
}
