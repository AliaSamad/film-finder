import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { listRatings } from "@/lib/lists";
import { requireUserId } from "@/lib/session";

export const GET = route(async () => {
  const userId = await requireUserId();
  return NextResponse.json({ ratings: await listRatings(userId) });
});
