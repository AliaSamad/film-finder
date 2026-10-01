import { NextResponse } from "next/server";
import { readJson, route } from "@/lib/api";
import { createSession } from "@/lib/session";
import { credentialsSchema, registerUser } from "@/lib/users";

export const POST = route(async (req: Request) => {
  const body = credentialsSchema.parse(await readJson(req));
  const user = await registerUser(body);
  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
});
