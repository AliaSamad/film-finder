"use client";

import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import { InlineError } from "@/components/ui";

// A toggle button for a film's membership in a per-user list. Shows progress
// while the request is in flight and any failure right beside the button.
function ListToggle({
  filmId,
  active,
  onChange,
  endpoint,
  labels,
  compact,
}: {
  filmId: number;
  active: boolean;
  onChange: (next: boolean) => void;
  endpoint: "watchlist" | "favourites";
  labels: { add: string; remove: string; adding: string; removing: string };
  compact?: boolean;
}) {
  const { pending, error, run } = useAction();

  const toggle = async () => {
    const next = !active;
    const done = await run(() => api(next ? "PUT" : "DELETE", `/api/${endpoint}/${filmId}`));
    if (done !== undefined) onChange(next);
  };

  return (
    <div className="toggle-wrap">
      <button
        className={`btn ${compact ? "btn-small" : ""} ${active ? "btn-active" : ""}`}
        onClick={toggle}
        disabled={pending}
        aria-pressed={active}
      >
        {pending ? (active ? labels.removing : labels.adding) : active ? labels.remove : labels.add}
      </button>
      <InlineError message={error} />
    </div>
  );
}

export function FavouriteButton(props: { filmId: number; active: boolean; onChange: (n: boolean) => void; compact?: boolean }) {
  return (
    <ListToggle
      {...props}
      endpoint="favourites"
      labels={{ add: "♡ Favourite", remove: "♥ Favourited", adding: "Adding…", removing: "Removing…" }}
    />
  );
}

export function WatchlistButton(props: { filmId: number; active: boolean; onChange: (n: boolean) => void; compact?: boolean }) {
  return (
    <ListToggle
      {...props}
      endpoint="watchlist"
      labels={{ add: "+ Watchlist", remove: "✓ On watchlist", adding: "Adding…", removing: "Removing…" }}
    />
  );
}
