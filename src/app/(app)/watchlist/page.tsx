"use client";

import { FilmCard } from "@/components/FilmCard";
import { WatchlistButton } from "@/components/ListButtons";
import { EmptyState, ErrorMessage, SkeletonGrid } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import type { FilmSummary } from "@/lib/types";

export default function WatchlistPage() {
  const { data, error, loading, reload, setData } = useFetch<{ films: FilmSummary[] }>("/api/watchlist");

  return (
    <>
      <div className="page-head">
        <h1>Your watchlist</h1>
        {data && data.films.length > 0 && <span className="muted">{data.films.length} to watch</span>}
      </div>

      {loading && <SkeletonGrid count={5} />}
      {error && <ErrorMessage title="Couldn't load your watchlist" message={error.message} onRetry={reload} />}

      {data && data.films.length === 0 && (
        <EmptyState title="Your watchlist is empty" action={{ href: "/", label: "Find something to watch" }}>
          Tap “+ Watchlist” on any film to save it for later.
        </EmptyState>
      )}

      {data && data.films.length > 0 && (
        <div className="grid">
          {data.films.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              footer={
                <WatchlistButton
                  compact
                  filmId={film.id}
                  active
                  onChange={() => setData((prev) => ({ films: prev.films.filter((f) => f.id !== film.id) }))}
                />
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
