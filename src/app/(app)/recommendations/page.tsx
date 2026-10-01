"use client";

import { FilmCard } from "@/components/FilmCard";
import { EmptyState, ErrorMessage, SkeletonGrid } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import { MIN_FAVOURITES, type Recommendation } from "@/lib/types";

export default function RecommendationsPage() {
  const { data, error, loading, reload } = useFetch<{ recommendations: Recommendation[]; basedOn: number }>(
    "/api/recommendations",
  );

  return (
    <>
      <div className="page-head">
        <h1>Recommended for you</h1>
        {data && <span className="muted">Based on your {data.basedOn} favourite films</span>}
      </div>

      {loading && <SkeletonGrid />}

      {error?.code === "need_favourites" && (
        <EmptyState title="Pick a few favourites first" action={{ href: "/favourites", label: "Choose favourites" }}>
          {error.message} Recommendations match films to the genres of your {MIN_FAVOURITES}–10 favourites.
        </EmptyState>
      )}

      {error && error.code !== "need_favourites" && (
        <ErrorMessage title="Couldn't load recommendations" message={error.message} onRetry={reload} />
      )}

      {data && data.recommendations.length === 0 && (
        <EmptyState title="No new recommendations" action={{ href: "/", label: "Discover films" }}>
          We couldn&apos;t find unrated films matching your favourites&apos; genres.
        </EmptyState>
      )}

      {data && data.recommendations.length > 0 && (
        <div className="grid">
          {data.recommendations.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              badge={`${Math.round(film.score * 100)}%`}
              footer={
                <ul className="chips" aria-label="Matching genres">
                  {film.matchedGenres.map((g) => (
                    <li className="chip" key={g.id}>
                      {g.name}
                    </li>
                  ))}
                </ul>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
