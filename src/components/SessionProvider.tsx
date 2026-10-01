"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, UNAUTHENTICATED_EVENT } from "@/lib/client";
import type { PublicUser } from "@/lib/types";

type SessionState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: PublicUser };

type SessionContextValue = {
  session: SessionState;
  signIn: (user: PublicUser) => void;
  signOut: () => Promise<void>;
  /** Forget the user locally (the server has already said there's no session). */
  clear: () => void;
  retry: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Ask the server who we are on load (and on retry).
  useEffect(() => {
    let cancelled = false;
    api<{ user: PublicUser | null }>("GET", "/api/auth/me")
      .then(({ user }) => {
        if (!cancelled) setSession(user ? { status: "signedIn", user } : { status: "signedOut" });
      })
      .catch(() => {
        if (!cancelled) setSession({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Any API call that comes back 401 means the session ended.
  useEffect(() => {
    const onExpired = () => setSession({ status: "signedOut" });
    window.addEventListener(UNAUTHENTICATED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHENTICATED_EVENT, onExpired);
  }, []);

  const signIn = useCallback((user: PublicUser) => setSession({ status: "signedIn", user }), []);

  const signOut = useCallback(async () => {
    try {
      await api("POST", "/api/auth/logout");
    } finally {
      setSession({ status: "signedOut" });
    }
  }, []);

  const clear = useCallback(() => setSession({ status: "signedOut" }), []);

  const retry = useCallback(() => {
    setSession({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut, clear, retry }), [session, signIn, signOut, clear, retry]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
