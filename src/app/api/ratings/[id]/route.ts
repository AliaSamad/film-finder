import { NextResponse } from "next/server";
import { readJson, route } from "@/lib/api";
import { deleteRating, upsertRating } from "@/lib/lists";
import { requireUserId } from "@/lib/session";
import { getFilm } from "@/lib/tmdb";
import { parseFilmId, ratingBodySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Sets (or changes) the user's 1-10 rating for a film.
export const PUT = route(async (req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const id = parseFilmId((await params).id);
  const { rating } = ratingBodySchema.parse(await readJson(req));
  // Snapshot title/poster server-side so clients can't store arbitrary data.
  const film = await getFilm(id);
  await upsertRating(userId, film, rating);
  return NextResponse.json({ rating });
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  await deleteRating(userId, parseFilmId((await params).id));
  return NextResponse.json({ ok: true });
});
