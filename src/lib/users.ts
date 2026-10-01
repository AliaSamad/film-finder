import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { getPool } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."), // bcrypt ignores bytes past 72
});

export type Credentials = z.infer<typeof credentialsSchema>;

const BCRYPT_ROUNDS = 12;

// Compared against when an email isn't found, so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export async function registerUser({ email, password }: Credentials): Promise<PublicUser> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const { rows } = await getPool().query<PublicUser>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::int AS id, email",
      [email, hash],
    );
    return rows[0];
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new ApiError(409, "An account with that email already exists.", "email_taken");
    }
    throw err;
  }
}

export async function verifyLogin({ email, password }: Credentials): Promise<PublicUser> {
  const { rows } = await getPool().query<PublicUser & { password_hash: string }>(
    "SELECT id::int AS id, email, password_hash FROM users WHERE lower(email) = lower($1)",
    [email],
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new ApiError(401, "Incorrect email or password.", "bad_credentials");
  }
  return { id: user.id, email: user.email };
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const { rows } = await getPool().query<PublicUser>(
    "SELECT id::int AS id, email FROM users WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
