"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilmCard } from "@/components/FilmCard";
import { FavouriteButton } from "@/components/ListButtons";
import { EmptyState, ErrorMessage, SkeletonGrid } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import { MAX_FAVOURITES, MIN_FAVOURITES, type FilmSummary, type SearchResults } from "@/lib/types";

// Search TMDB and favourite films straight from the results. The query and
// page live in the URL so the back button restores a search.
export function Discover() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const search = useFetch<SearchResults>(
    q ? `/api/films/search?q=${encodeURIComponent(q)}&page=${page}` : null,
  );
  const favourites = useFetch<{ films: FilmSummary[] }>("/api/favourites");
  const favouriteIds = new Set(favourites.data?.films.map((f) => f.id));
  const count = favourites.data?.films.length ?? 0;

  const go = (nextQ: string, nextPage = 1) => {
    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    if (nextPage > 1) sp.set("page", String(nextPage));
    router.push(sp.size ? `/?${sp}` : "/");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q");
    go(typeof value === "string" ? value.trim() : "");
  };

  const toggleFavourite = (film: FilmSummary, next: boolean) =>
    favourites.setData((prev) => ({
      films: next ? [...prev.films, film] : prev.films.filter((f) => f.id !== film.id),
    }));

  return (
    <>
      <div className="page-head">
        <h1>Discover films</h1>
        {favourites.data && (
          <span className="muted">
            {count}/{MAX_FAVOURITES} favourites
            {count < MIN_FAVOURITES ? ` · pick ${MIN_FAVOURITES - count} more for recommendations` : ""}
          </span>
        )}
      </div>

      {/* key remounts the (uncontrolled) input when the URL query changes */}
      <form className="search" role="search" onSubmit={onSubmit} key={q}>
        <input type="search" name="q" defaultValue={q} placeholder="Search for a film…" aria-label="Search films" maxLength={100} autoFocus />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      {favourites.error && (
        <ErrorMessage
          title="Couldn't load your favourites"
          message={`${favourites.error.message} You can still search, but favouriting is unavailable.`}
          onRetry={favourites.reload}
        />
      )}

      {!q && (
        <EmptyState title="Find films you love">
          Search for a title, then tap ♡ Favourite on {MIN_FAVOURITES}–{MAX_FAVOURITES} films to unlock recommendations based on the genres you enjoy.
        </EmptyState>
      )}

      {q && search.loading && <SkeletonGrid />}

      {q && search.error && (
        <ErrorMessage title="Search failed" message={search.error.message} onRetry={search.reload} />
      )}

      {search.data && search.data.films.length === 0 && (
        <EmptyState title="No films found">Nothing matched “{q}”. Try a different title.</EmptyState>
      )}

      {search.data && search.data.films.length > 0 && (
        <>
          <div className="grid">
            {search.data.films.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                footer={
                  favourites.data ? (
                    <FavouriteButton
                      compact
                      filmId={film.id}
                      active={favouriteIds.has(film.id)}
                      onChange={(next) => toggleFavourite(film, next)}
                    />
                  ) : null
                }
              />
            ))}
          </div>
          {search.data.totalPages > 1 && (
            <nav className="pager" aria-label="Search results pages">
              <button className="btn" onClick={() => go(q, page - 1)} disabled={page <= 1}>
                ← Previous
              </button>
              <span className="muted">
                Page {search.data.page} of {search.data.totalPages}
              </span>
              <button className="btn" onClick={() => go(q, page + 1)} disabled={page >= search.data.totalPages}>
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
