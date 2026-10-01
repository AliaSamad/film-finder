"use client";

import { FilmCard } from "@/components/FilmCard";
import { EmptyState, ErrorMessage, SkeletonGrid } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import type { RatedFilm } from "@/lib/types";

export default function RatingsPage() {
  const { data, error, loading, reload } = useFetch<{ ratings: RatedFilm[] }>("/api/ratings");

  return (
    <>
      <div className="page-head">
        <h1>Your ratings</h1>
        {data && data.ratings.length > 0 && <span className="muted">{data.ratings.length} rated</span>}
      </div>

      {loading && <SkeletonGrid count={5} />}
      {error && <ErrorMessage title="Couldn't load your ratings" message={error.message} onRetry={reload} />}

      {data && data.ratings.length === 0 && (
        <EmptyState title="You haven't rated anything yet" action={{ href: "/", label: "Find films to rate" }}>
          Open a film and score it from 1 to 10.
        </EmptyState>
      )}

      {data && data.ratings.length > 0 && (
        <div className="grid">
          {data.ratings.map((film) => (
            <FilmCard key={film.id} film={film} badge={`${film.rating}/10`} />
          ))}
        </div>
      )}
    </>
  );
}
