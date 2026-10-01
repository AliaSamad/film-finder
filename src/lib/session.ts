import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { ApiError } from "@/lib/api";

const COOKIE_NAME = "ff_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

// Signs a JWT holding just the user id and stores it in an httpOnly cookie.
export async function createSession(userId: number): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// Returns the signed-in user's id, or null if there's no valid session.
export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    const id = Number(payload.sub);
    return Number.isSafeInteger(id) ? id : null;
  } catch {
    return null; // expired, tampered with, or signed with an old secret
  }
}

// For routes that need a signed-in user.
export async function requireUserId(): Promise<number> {
  const id = await getSessionUserId();
  if (id === null) {
    throw new ApiError(401, "Please sign in to continue.", "unauthenticated");
  }
  return id;
}
