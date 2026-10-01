import { NextResponse } from "next/server";
import { readJson, route } from "@/lib/api";
import { createSession } from "@/lib/session";
import { credentialsSchema, verifyLogin } from "@/lib/users";

export const POST = route(async (req: Request) => {
  const body = credentialsSchema.parse(await readJson(req));
  const user = await verifyLogin(body);
  await createSession(user.id);
  return NextResponse.json({ user });
});
