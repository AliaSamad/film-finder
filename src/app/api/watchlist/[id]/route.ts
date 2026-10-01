import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist } from "@/lib/lists";
import { requireUserId } from "@/lib/session";
import { getFilm } from "@/lib/tmdb";
import { parseFilmId } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Idempotent: adding a film that's already on the watchlist is a no-op.
export const PUT = route(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const film = await getFilm(parseFilmId((await params).id));
  await addToWatchlist(userId, film);
  return NextResponse.json({ ok: true });
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  await removeFromWatchlist(userId, parseFilmId((await params).id));
  return NextResponse.json({ ok: true });
});
