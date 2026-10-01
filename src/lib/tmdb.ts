import { ApiError } from "@/lib/api";
import type { FilmDetails, FilmSummary, Genre, SearchResults } from "@/lib/types";

// TMDB_BASE_URL is overridable so the API can be pointed at a mock in tests.
const BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

type Query = Record<string, string | number | boolean | undefined>;

async function tmdb<T>(path: string, query: Query = {}, revalidate = 3600): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    throw new ApiError(503, "Film data isn't configured (missing TMDB token).", "tmdb_not_configured");
  }

  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate },
    });
  } catch {
    throw new ApiError(502, "Couldn't reach the film database. Try again in a moment.", "tmdb_unreachable");
  }

  if (res.status === 404) throw new ApiError(404, "Film not found.", "not_found");
  if (res.status === 401) {
    throw new ApiError(502, "The film database rejected our credentials.", "tmdb_auth");
  }
  if (res.status === 429) {
    throw new ApiError(503, "The film database is busy. Try again shortly.", "tmdb_rate_limited");
  }
  if (!res.ok) {
    throw new ApiError(502, "The film database returned an error.", "tmdb_error");
  }
  return (await res.json()) as T;
}

// ---- raw TMDB shapes (only the fields we read) ----

type RawMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  genre_ids?: number[];
  overview?: string;
  vote_average?: number;
  vote_count?: number;
};

type RawMovieDetails = Omit<RawMovie, "genre_ids"> & {
  genres: Genre[];
  runtime: number | null;
  tagline: string | null;
  backdrop_path: string | null;
};

type RawPage = { page: number; total_pages: number; results: RawMovie[] };

function yearOf(releaseDate?: string): number | null {
  const y = Number.parseInt(releaseDate?.slice(0, 4) ?? "", 10);
  return Number.isFinite(y) ? y : null;
}

function toSummary(m: RawMovie): FilmSummary {
  return {
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: yearOf(m.release_date),
    genreIds: m.genre_ids ?? [],
    overview: m.overview,
    voteAverage: m.vote_average,
  };
}

// ---- public API ----

export async function searchFilms(query: string, page = 1): Promise<SearchResults> {
  const data = await tmdb<RawPage>("/search/movie", {
    query,
    page,
    include_adult: false,
  });
  return {
    page: data.page,
    // TMDB caps pagination at 500 pages.
    totalPages: Math.min(data.total_pages, 500),
    films: data.results.map(toSummary),
  };
}

export async function getFilm(id: number): Promise<FilmDetails> {
  const m = await tmdb<RawMovieDetails>(`/movie/${id}`, {}, 86400);
  return {
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: yearOf(m.release_date),
    genreIds: m.genres.map((g) => g.id),
    genres: m.genres,
    overview: m.overview ?? "",
    runtime: m.runtime,
    tagline: m.tagline || null,
    backdropPath: m.backdrop_path,
    voteAverage: m.vote_average,
  };
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdb<{ genres: Genre[] }>("/genre/movie/list", {}, 86400);
  return data.genres;
}

// Popular, well-rated films in any of the given genres. This is the candidate
// pool the recommender scores; pages are fetched in parallel and de-duplicated.
export async function discoverByGenres(
  genreIds: number[],
  pages: number[] = [1, 2, 3],
): Promise<FilmSummary[]> {
  if (genreIds.length === 0) return [];
  const results = await Promise.all(
    pages.map((page) =>
      tmdb<RawPage>("/discover/movie", {
        with_genres: genreIds.join("|"), // "|" means OR
        sort_by: "popularity.desc",
        "vote_count.gte": 300,
        include_adult: false,
        page,
      }),
    ),
  );
  const seen = new Map<number, FilmSummary>();
  for (const page of results) {
    for (const m of page.results) {
      if (!seen.has(m.id)) seen.set(m.id, toSummary(m));
    }
  }
  return [...seen.values()];
}
