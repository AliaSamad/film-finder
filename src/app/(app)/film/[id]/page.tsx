"use client";

import Link from "next/link";
import { use } from "react";
import { Poster } from "@/components/Poster";
import { FavouriteButton, WatchlistButton } from "@/components/ListButtons";
import { RatingControl } from "@/components/RatingControl";
import { ErrorMessage, PageLoading } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import type { FilmDetails, UserFilmState } from "@/lib/types";

type Payload = { film: FilmDetails; state: UserFilmState };

export default function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload, setData } = useFetch<Payload>(`/api/films/${encodeURIComponent(id)}`);

  if (loading) return <PageLoading label="Loading film…" />;

  if (error) {
    const notFound = error.code === "not_found" || error.code === "bad_id";
    return (
      <>
        <p>
          <Link href="/">← Back to Discover</Link>
        </p>
        <ErrorMessage
          title={notFound ? "Film not found" : "Couldn't load this film"}
          message={notFound ? "We couldn't find a film with that id." : error.message}
          onRetry={notFound ? undefined : reload}
        />
      </>
    );
  }
  if (!data) return null;

  const { film, state } = data;
  const patch = (changes: Partial<UserFilmState>) =>
    setData((prev) => ({ ...prev, state: { ...prev.state, ...changes } }));

  return (
    <>
      <p>
        <Link href="/">← Back to Discover</Link>
      </p>
      <div className="detail">
        <Poster title={film.title} path={film.posterPath} />
        <div>
          <h1>
            {film.title} {film.year && <span className="muted">({film.year})</span>}
          </h1>
          {film.tagline && <p className="tagline">{film.tagline}</p>}

          <ul className="chips" aria-label="Genres">
            {film.genres.map((g) => (
              <li className="chip" key={g.id}>
                {g.name}
              </li>
            ))}
            {film.runtime ? <li className="chip">{film.runtime} min</li> : null}
            {film.voteAverage ? <li className="chip">TMDB {film.voteAverage.toFixed(1)}</li> : null}
          </ul>

          <p>{film.overview || "No overview available."}</p>

          <div className="detail-actions">
            <FavouriteButton filmId={film.id} active={state.isFavourite} onChange={(v) => patch({ isFavourite: v })} />
            <WatchlistButton filmId={film.id} active={state.inWatchlist} onChange={(v) => patch({ inWatchlist: v })} />
          </div>

          <RatingControl filmId={film.id} rating={state.rating} onChange={(v) => patch({ rating: v })} />
        </div>
      </div>
    </>
  );
}
