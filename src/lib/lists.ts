import type { PoolClient } from "pg";
import { ApiError } from "@/lib/api";
import { getPool } from "@/lib/db";
import { MAX_FAVOURITES, type FilmSummary, type RatedFilm, type UserFilmState } from "@/lib/types";

type Row = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre_ids?: number[];
};

const toFilm = (r: Row): FilmSummary => ({
  id: r.tmdb_id,
  title: r.title,
  posterPath: r.poster_path,
  year: r.year,
  genreIds: r.genre_ids ?? [],
});

// ---- combined per-film state ----

export async function getFilmState(userId: number, tmdbId: number): Promise<UserFilmState> {
  const { rows } = await getPool().query<{
    rating: number | null;
    in_watchlist: boolean;
    is_favourite: boolean;
  }>(
    `SELECT
       (SELECT rating FROM ratings   WHERE user_id = $1 AND tmdb_id = $2) AS rating,
       EXISTS (SELECT 1 FROM watchlist  WHERE user_id = $1 AND tmdb_id = $2) AS in_watchlist,
       EXISTS (SELECT 1 FROM favourites WHERE user_id = $1 AND tmdb_id = $2) AS is_favourite`,
    [userId, tmdbId],
  );
  const r = rows[0];
  return { rating: r.rating, inWatchlist: r.in_watchlist, isFavourite: r.is_favourite };
}

// ---- ratings ----

export async function listRatings(userId: number): Promise<RatedFilm[]> {
  const { rows } = await getPool().query<Row & { rating: number; updated_at: Date }>(
    `SELECT tmdb_id, title, poster_path, year, rating, updated_at
       FROM ratings WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map((r) => ({ ...toFilm(r), rating: r.rating, ratedAt: r.updated_at.toISOString() }));
}

export async function upsertRating(userId: number, film: FilmSummary, rating: number) {
  await getPool().query(
    `INSERT INTO ratings (user_id, tmdb_id, title, poster_path, year, rating)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, tmdb_id)
     DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title,
                   poster_path = EXCLUDED.poster_path, year = EXCLUDED.year,
                   updated_at = now()`,
    [userId, film.id, film.title, film.posterPath, film.year, rating],
  );
}

export async function deleteRating(userId: number, tmdbId: number) {
  await getPool().query("DELETE FROM ratings WHERE user_id = $1 AND tmdb_id = $2", [userId, tmdbId]);
}

// ---- watchlist ----

export async function listWatchlist(userId: number): Promise<FilmSummary[]> {
  const { rows } = await getPool().query<Row>(
    `SELECT tmdb_id, title, poster_path, year
       FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC`,
    [userId],
  );
  return rows.map(toFilm);
}

export async function addToWatchlist(userId: number, film: FilmSummary) {
  await getPool().query(
    `INSERT INTO watchlist (user_id, tmdb_id, title, poster_path, year)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, tmdb_id) DO NOTHING`,
    [userId, film.id, film.title, film.posterPath, film.year],
  );
}

export async function removeFromWatchlist(userId: number, tmdbId: number) {
  await getPool().query("DELETE FROM watchlist WHERE user_id = $1 AND tmdb_id = $2", [userId, tmdbId]);
}

// ---- favourites (capped) ----

export async function listFavourites(userId: number): Promise<FilmSummary[]> {
  const { rows } = await getPool().query<Row>(
    `SELECT tmdb_id, title, poster_path, year, genre_ids
       FROM favourites WHERE user_id = $1 ORDER BY added_at`,
    [userId],
  );
  return rows.map(toFilm);
}

export async function addFavourite(userId: number, film: FilmSummary) {
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("BEGIN");
    // Lock the user's row so two concurrent adds can't both slip past the cap.
    await client.query("SELECT 1 FROM users WHERE id = $1 FOR UPDATE", [userId]);

    const existing = await client.query(
      "SELECT 1 FROM favourites WHERE user_id = $1 AND tmdb_id = $2",
      [userId, film.id],
    );
    if (existing.rowCount === 0) {
      const { rows } = await client.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM favourites WHERE user_id = $1",
        [userId],
      );
      if (rows[0].n >= MAX_FAVOURITES) {
        throw new ApiError(
          409,
          `You can pick at most ${MAX_FAVOURITES} favourites. Remove one to add another.`,
          "favourites_full",
        );
      }
    }

    await client.query(
      `INSERT INTO favourites (user_id, tmdb_id, title, poster_path, year, genre_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, tmdb_id) DO NOTHING`,
      [userId, film.id, film.title, film.posterPath, film.year, film.genreIds],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function removeFavourite(userId: number, tmdbId: number) {
  await getPool().query("DELETE FROM favourites WHERE user_id = $1 AND tmdb_id = $2", [userId, tmdbId]);
}

// Ids of every film the user has already rated, for filtering recommendations.
export async function ratedIds(userId: number): Promise<number[]> {
  const { rows } = await getPool().query<{ tmdb_id: number }>(
    "SELECT tmdb_id FROM ratings WHERE user_id = $1",
    [userId],
  );
  return rows.map((r) => r.tmdb_id);
}
