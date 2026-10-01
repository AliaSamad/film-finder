import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { searchFilms } from "@/lib/tmdb";

const querySchema = z.string().trim().min(1, "Enter a film title to search.").max(100, "Search is too long.");
const pageSchema = z.coerce.number().int().min(1).max(500).catch(1);

export const GET = route(async (req: Request) => {
  await requireUserId();
  const params = new URL(req.url).searchParams;
  const q = querySchema.parse(params.get("q") ?? "");
  const page = pageSchema.parse(params.get("page") ?? 1);
  return NextResponse.json(await searchFilms(q, page));
});
