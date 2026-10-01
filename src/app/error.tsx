"use client";

import { ErrorMessage } from "@/components/ui";

// Catches unexpected rendering errors anywhere below the root layout.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container">
      <ErrorMessage
        title="This page crashed"
        message={error.message || "An unexpected error occurred."}
        onRetry={reset}
      />
    </div>
  );
}
