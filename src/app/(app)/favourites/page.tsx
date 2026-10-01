"use client";

import Link from "next/link";
import { FilmCard } from "@/components/FilmCard";
import { FavouriteButton } from "@/components/ListButtons";
import { EmptyState, ErrorMessage, SkeletonGrid } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import { MAX_FAVOURITES, MIN_FAVOURITES, type FilmSummary } from "@/lib/types";

export default function FavouritesPage() {
  const { data, error, loading, reload, setData } = useFetch<{ films: FilmSummary[] }>("/api/favourites");
  const count = data?.films.length ?? 0;
  const ready = count >= MIN_FAVOURITES;

  return (
    <>
      <div className="page-head">
        <h1>Your favourites</h1>
      </div>

      {loading && <SkeletonGrid count={5} />}
      {error && <ErrorMessage title="Couldn't load your favourites" message={error.message} onRetry={reload} />}

      {data && (
        <>
          <section className="panel" aria-label="Recommendation progress">
            <strong>
              {count} of {MAX_FAVOURITES} favourites
            </strong>
            <div
              className="meter"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={MAX_FAVOURITES}
              aria-valuenow={count}
              aria-label="Favourites chosen"
            >
              <div className={`meter-fill ${ready ? "ready" : ""}`} style={{ width: `${(count / MAX_FAVOURITES) * 100}%` }} />
            </div>
            {ready ? (
              <p>
                You&apos;re set — <Link href="/recommendations">see your recommendations →</Link>
              </p>
            ) : (
              <p className="muted">
                Pick at least {MIN_FAVOURITES} to unlock recommendations ({MIN_FAVOURITES - count} more to go).{" "}
                <Link href="/">Find films →</Link>
              </p>
            )}
          </section>

          {count === 0 ? (
            <EmptyState title="No favourites yet" action={{ href: "/", label: "Search for films" }}>
              Choose {MIN_FAVOURITES}–{MAX_FAVOURITES} films you love and we&apos;ll recommend more like them.
            </EmptyState>
          ) : (
            <div className="grid">
              {data.films.map((film) => (
                <FilmCard
                  key={film.id}
                  film={film}
                  footer={
                    <FavouriteButton
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
      )}
    </>
  );
}
