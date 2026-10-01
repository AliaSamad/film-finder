import { z } from "zod";
import { ApiError } from "@/lib/api";

const filmIdSchema = z.coerce.number().int().positive().max(2_147_483_647);

// Route params arrive as strings; reject anything that isn't a sane TMDB id.
export function parseFilmId(raw: string): number {
  const parsed = filmIdSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, "Invalid film id.", "bad_id");
  return parsed.data;
}

export const ratingBodySchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be between 1 and 10.")
    .max(10, "Rating must be between 1 and 10."),
});
