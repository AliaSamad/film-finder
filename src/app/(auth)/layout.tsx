"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { api } from "@/lib/client";
import type { PublicUser } from "@/lib/types";

// Auth pages: send already-signed-in users to the app.
//
// This asks the server rather than trusting client state. If the session cookie
// vanished (expired, or signed out in another tab) the client can still think
// it's signed in, and redirecting on that would loop with the proxy, which
// sends cookie-less requests back here.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { signIn, clear } = useSession();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api<{ user: PublicUser | null }>("GET", "/api/auth/me")
      .then(({ user }) => {
        if (cancelled) return;
        if (user) {
          signIn(user);
          router.replace("/");
        } else {
          clear();
        }
      })
      .catch(() => {
        /* server unreachable: just show the form */
      });
    return () => {
      cancelled = true;
    };
  }, [router, signIn, clear]);

  return <main className="auth-wrap">{children}</main>;
}
