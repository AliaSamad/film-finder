import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { addFavourite, removeFavourite } from "@/lib/lists";
import { requireUserId } from "@/lib/session";
import { getFilm } from "@/lib/tmdb";
import { parseFilmId } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Idempotent add; rejects with 409 once the user already has 10 favourites.
export const PUT = route(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  const film = await getFilm(parseFilmId((await params).id));
  await addFavourite(userId, film);
  return NextResponse.json({ ok: true });
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUserId();
  await removeFavourite(userId, parseFilmId((await params).id));
  return NextResponse.json({ ok: true });
});
