import { NextResponse } from "next/server";
import { ZodError } from "zod";

// A failure we expect and can describe to the client.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = "error",
  ) {
    super(message);
  }
}

export type ApiErrorBody = { error: { message: string; code: string } };

function errorResponse(status: number, message: string, code: string) {
  return NextResponse.json<ApiErrorBody>(
    { error: { message, code } },
    { status },
  );
}

// Wraps a route handler so every failure comes back as the same JSON shape,
// which lets the UI show a meaningful error for any request.
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.message, err.code);
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return errorResponse(400, first?.message ?? "Invalid input.", "validation");
      }
      console.error(err);
      return errorResponse(500, "Something went wrong on our side.", "internal");
    }
  };
}

// Parses a JSON body, turning malformed JSON into a 400 instead of a 500.
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.", "bad_json");
  }
}
