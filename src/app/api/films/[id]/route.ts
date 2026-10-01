import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getFilmState } from "@/lib/lists";
import { requireUserId } from "@/lib/session";
import { getFilm } from "@/lib/tmdb";
import { parseFilmId } from "@/lib/validation";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireUserId();
  const id = parseFilmId((await params).id);
  const [film, state] = await Promise.all([getFilm(id), getFilmState(userId, id)]);
  return NextResponse.json({ film, state });
});
