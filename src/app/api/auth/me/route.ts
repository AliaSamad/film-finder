import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getSessionUserId } from "@/lib/session";
import { getUserById } from "@/lib/users";

// Returns the signed-in user, or { user: null } when signed out. Never 401s,
// so the client can call it on load to find out who (if anyone) is signed in.
export const GET = route(async () => {
  const id = await getSessionUserId();
  const user = id === null ? null : await getUserById(id);
  return NextResponse.json({ user });
});
