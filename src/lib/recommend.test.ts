import { describe, expect, it } from "vitest";
import { genreWeights, recommend, scoreGenres, topGenres } from "@/lib/recommend";
import type { FilmSummary } from "@/lib/types";

// Genre ids used below: 28 Action, 35 Comedy, 18 Drama, 878 Sci-Fi, 53 Thriller, 27 Horror
const film = (id: number, genreIds: number[], voteAverage = 7): FilmSummary => ({
  id,
  title: `Film ${id}`,
  posterPath: null,
  year: 2000,
  genreIds,
  voteAverage,
});

describe("genreWeights", () => {
  it("weights each genre by the fraction of favourites containing it", () => {
    const w = genreWeights([
      { genreIds: [878, 53] },
      { genreIds: [878, 18] },
      { genreIds: [878] },
      { genreIds: [18] },
    ]);
    expect(w.get(878)).toBe(0.75);
    expect(w.get(18)).toBe(0.5);
    expect(w.get(53)).toBe(0.25);
  });

  it("counts a genre once per film even if listed twice", () => {
    const w = genreWeights([{ genreIds: [28, 28] }, { genreIds: [35] }]);
    expect(w.get(28)).toBe(0.5);
  });
});

describe("topGenres", () => {
  it("orders by weight, breaking ties by genre id", () => {
    const w = genreWeights([{ genreIds: [35, 28] }, { genreIds: [28, 18] }]);
    expect(topGenres(w, 2)).toEqual([28, 18]);
    expect(topGenres(w, 10)).toEqual([28, 18, 35]);
  });
});

describe("scoreGenres", () => {
  const w = genreWeights([
    { genreIds: [878, 53] },
    { genreIds: [878, 28] },
    { genreIds: [878, 18] },
  ]);

  it("returns zero with no overlap", () => {
    expect(scoreGenres(w, [35, 27])).toEqual({ score: 0, matchedGenreIds: [] });
  });

  it("returns zero for empty inputs", () => {
    expect(scoreGenres(w, []).score).toBe(0);
    expect(scoreGenres(new Map(), [878]).score).toBe(0);
  });

  it("scores a film matching the strongest genre above one matching a weak genre", () => {
    expect(scoreGenres(w, [878]).score).toBeGreaterThan(scoreGenres(w, [53]).score);
  });

  it("discounts films padded with unrelated genres", () => {
    expect(scoreGenres(w, [878]).score).toBeGreaterThan(scoreGenres(w, [878, 35, 27]).score);
  });

  it("stays within 0..1 and reports matched genres strongest first", () => {
    const r = scoreGenres(w, [53, 878]);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.matchedGenreIds).toEqual([878, 53]);
  });

  it("gives a perfect score to a film whose genres exactly mirror a one-genre profile", () => {
    const single = genreWeights([{ genreIds: [35] }, { genreIds: [35] }]);
    expect(scoreGenres(single, [35]).score).toBeCloseTo(1);
  });
});

describe("recommend", () => {
  const favourites = [
    { id: 1, genreIds: [878, 53] },
    { id: 2, genreIds: [878, 28] },
    { id: 3, genreIds: [53, 18] },
    { id: 4, genreIds: [878] },
    { id: 5, genreIds: [18, 28] },
  ];

  it("ranks by genre overlap and drops films with none", () => {
    const out = recommend(favourites, [
      film(10, [35]), // no overlap
      film(11, [53]),
      film(12, [878, 53]),
      film(13, [878]),
    ]);
    expect(out.map((r) => r.film.id)).toEqual([12, 13, 11]);
  });

  it("excludes favourites and any extra excluded ids", () => {
    const out = recommend(favourites, [film(1, [878]), film(20, [878]), film(21, [878])], {
      excludeIds: [21],
    });
    expect(out.map((r) => r.film.id)).toEqual([20]);
  });

  it("breaks score ties by rating, then id", () => {
    const out = recommend(favourites, [
      film(30, [878], 6),
      film(31, [878], 8),
      film(29, [878], 8),
    ]);
    expect(out.map((r) => r.film.id)).toEqual([29, 31, 30]);
  });

  it("ignores duplicate candidates", () => {
    const out = recommend(favourites, [film(40, [878]), film(40, [878])]);
    expect(out).toHaveLength(1);
  });

  it("respects the limit", () => {
    const candidates = Array.from({ length: 30 }, (_, i) => film(100 + i, [878]));
    expect(recommend(favourites, candidates, { limit: 5 })).toHaveLength(5);
  });

  it("returns nothing when there are no favourites", () => {
    expect(recommend([], [film(50, [878])])).toEqual([]);
  });
});
