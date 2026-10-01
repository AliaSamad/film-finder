import Link from "next/link";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner-ring" />
    </span>
  );
}

// Full-area loading indicator for pages that have nothing to show yet.
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-state" role="status" aria-live="polite">
      <Spinner label={label} />
      <p className="muted">{label}</p>
    </div>
  );
}

// Placeholder cards shown while a list loads, so the layout doesn't jump.
export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading films">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="poster skeleton" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorMessage({
  message,
  onRetry,
  title = "Something went wrong",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="error-box" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// Small inline error for failed actions, shown next to the control.
export function InlineError({ message }: { message: string | null }) {
  return message ? (
    <p className="inline-error" role="alert">
      {message}
    </p>
  ) : null;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="page-state">
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action && (
        <Link className="btn btn-primary" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
