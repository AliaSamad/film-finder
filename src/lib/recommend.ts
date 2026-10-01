import type { FilmSummary } from "@/lib/types";

// Genre-overlap recommendations.
//
// 1. Turn the user's favourites into a genre profile: each genre's weight is the
//    fraction of favourites that include it (so a genre in 4 of 5 favourites
//    weighs 0.8, one appearing once weighs 0.2).
// 2. Score each candidate film by cosine similarity between that profile and the
//    film's genres: shared genre weight / (profile length * sqrt(film genres)).
//    Overlap on the user's strongest genres counts most, and films padded with
//    many unrelated genres are slightly discounted.
// 3. Rank by score, then TMDB rating, then id (so results are deterministic).

export type GenreWeights = Map<number, number>;

export type Scored<T extends FilmSummary = FilmSummary> = {
  film: T;
  score: number; // 0-1
  matchedGenreIds: number[];
};

export function genreWeights(favourites: { genreIds: number[] }[]): GenreWeights {
  const counts = new Map<number, number>();
  for (const fav of favourites) {
    for (const g of new Set(fav.genreIds)) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const weights: GenreWeights = new Map();
  for (const [g, n] of counts) weights.set(g, n / favourites.length);
  return weights;
}

// The n heaviest genres, ties broken by genre id for stable output.
export function topGenres(weights: GenreWeights, n: number): number[] {
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, n)
    .map(([g]) => g);
}

export function scoreGenres(
  weights: GenreWeights,
  filmGenreIds: number[],
): { score: number; matchedGenreIds: number[] } {
  const genres = [...new Set(filmGenreIds)];
  if (genres.length === 0 || weights.size === 0) return { score: 0, matchedGenreIds: [] };

  let dot = 0;
  const matched: number[] = [];
  for (const g of genres) {
    const w = weights.get(g);
    if (w !== undefined) {
      dot += w;
      matched.push(g);
    }
  }
  if (matched.length === 0) return { score: 0, matchedGenreIds: [] };

  let profileNorm = 0;
  for (const w of weights.values()) profileNorm += w * w;
  const score = dot / (Math.sqrt(profileNorm) * Math.sqrt(genres.length));
  return { score, matchedGenreIds: matched.sort((a, b) => weights.get(b)! - weights.get(a)! || a - b) };
}

export function recommend<T extends FilmSummary>(
  favourites: { id: number; genreIds: number[] }[],
  candidates: T[],
  options: { limit?: number; excludeIds?: Iterable<number> } = {},
): Scored<T>[] {
  const { limit = 20 } = options;
  const exclude = new Set<number>(options.excludeIds ?? []);
  for (const f of favourites) exclude.add(f.id);

  const weights = genreWeights(favourites);
  const scored: Scored<T>[] = [];
  const seen = new Set<number>();

  for (const film of candidates) {
    if (exclude.has(film.id) || seen.has(film.id)) continue;
    seen.add(film.id);
    const { score, matchedGenreIds } = scoreGenres(weights, film.genreIds);
    if (score > 0) scored.push({ film, score, matchedGenreIds });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.film.voteAverage ?? 0) - (a.film.voteAverage ?? 0) ||
      a.film.id - b.film.id,
  );
  return scored.slice(0, limit);
}
