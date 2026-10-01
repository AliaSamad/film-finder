import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { listWatchlist } from "@/lib/lists";
import { requireUserId } from "@/lib/session";

export const GET = route(async () => {
  const userId = await requireUserId();
  return NextResponse.json({ films: await listWatchlist(userId) });
});
