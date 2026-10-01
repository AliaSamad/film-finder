"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { errorMessage } from "@/lib/client";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/recommendations", label: "For you" },
  { href: "/favourites", label: "Favourites" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/ratings", label: "My ratings" },
];

export function Nav() {
  const pathname = usePathname();
  const { session, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(errorMessage(err));
      setSigningOut(false);
    }
  };

  return (
    <header className="nav">
      <Link href="/" className="brand">
        🎬 Film Finder
      </Link>
      <nav aria-label="Main">
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="nav-user">
        {session.status === "signedIn" && <span className="muted nav-email">{session.user.email}</span>}
        <button className="btn btn-small" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        {error && <span className="inline-error">{error}</span>}
      </div>
    </header>
  );
}
