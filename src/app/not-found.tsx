import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container">
      <EmptyState title="Page not found" action={{ href: "/", label: "Back to Discover" }}>
        That page doesn&apos;t exist.
      </EmptyState>
      <p className="muted" style={{ textAlign: "center" }}>
        <Link href="/">Film Finder</Link>
      </p>
    </div>
  );
}
