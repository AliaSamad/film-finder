"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { ErrorMessage, PageLoading } from "@/components/ui";

// Gate for pages that need a signed-in user. The API enforces auth itself;
// this just decides what to render while we find out who's signed in.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, retry } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "signedOut") router.replace("/login");
  }, [session.status, router]);

  if (session.status === "loading" || session.status === "signedOut") {
    return <PageLoading label={session.status === "loading" ? "Checking your session…" : "Redirecting to sign in…"} />;
  }
  if (session.status === "error") {
    return (
      <div className="container">
        <ErrorMessage
          title="Can't reach Film Finder"
          message="We couldn't check whether you're signed in. Check your connection and try again."
          onRetry={retry}
        />
      </div>
    );
  }
  return <>{children}</>;
}
