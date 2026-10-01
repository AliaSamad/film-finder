import { NextResponse } from "next/server";
import { ApiError, route } from "@/lib/api";
import { listFavourites, ratedIds } from "@/lib/lists";
import { genreWeights, recommend, topGenres } from "@/lib/recommend";
import { requireUserId } from "@/lib/session";
import { discoverByGenres, getGenres } from "@/lib/tmdb";
import { MIN_FAVOURITES, type Recommendation } from "@/lib/types";

// How many of the user's strongest genres we pull candidate films from.
const SEED_GENRES = 4;

export const GET = route(async () => {
  const userId = await requireUserId();

  const favourites = await listFavourites(userId);
  if (favourites.length < MIN_FAVOURITES) {
    throw new ApiError(
      409,
      `Pick at least ${MIN_FAVOURITES} favourite films to get recommendations (you have ${favourites.length}).`,
      "need_favourites",
    );
  }

  const seeds = topGenres(genreWeights(favourites), SEED_GENRES);
  const [candidates, genres, rated] = await Promise.all([
    discoverByGenres(seeds),
    getGenres(),
    ratedIds(userId),
  ]);

  const names = new Map(genres.map((g) => [g.id, g.name]));
  const recommendations: Recommendation[] = recommend(favourites, candidates, {
    limit: 20,
    excludeIds: rated, // don't suggest films they've already seen and rated
  }).map(({ film, score, matchedGenreIds }) => ({
    ...film,
    score,
    matchedGenres: matchedGenreIds.map((id) => ({ id, name: names.get(id) ?? "Unknown" })),
  }));

  return NextResponse.json({ recommendations, basedOn: favourites.length });
});
