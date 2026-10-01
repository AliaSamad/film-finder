// Shared between the API and the UI.

export const MIN_FAVOURITES = 5;
export const MAX_FAVOURITES = 10;

// The slice of a film we show in lists and store alongside a user's data.
export type FilmSummary = {
  id: number; // TMDB id
  title: string;
  posterPath: string | null;
  year: number | null;
  genreIds: number[];
  overview?: string;
  voteAverage?: number;
};

export type Genre = { id: number; name: string };

export type PublicUser = { id: number; email: string };

export type FilmDetails = FilmSummary & {
  genres: Genre[];
  overview: string;
  runtime: number | null;
  tagline: string | null;
  backdropPath: string | null;
};

export type RatedFilm = FilmSummary & { rating: number; ratedAt: string };

export type UserFilmState = {
  rating: number | null; // 1-10
  inWatchlist: boolean;
  isFavourite: boolean;
};

export type SearchResults = {
  page: number;
  totalPages: number;
  films: FilmSummary[];
};

export type Recommendation = FilmSummary & {
  score: number; // 0-1 genre similarity to the user's favourites
  matchedGenres: Genre[];
};

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
