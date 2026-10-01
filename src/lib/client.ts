import type { ApiErrorBody } from "@/lib/api";

// An error from our API (or from failing to reach it), with a message that is
// safe to show to the user.
export class ClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

export const UNAUTHENTICATED_EVENT = "ff:unauthenticated";

export async function api<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ClientError("Can't reach the server. Check your connection and try again.", 0, "network");
  }

  if (!res.ok) {
    let parsed: Partial<ApiErrorBody> = {};
    try {
      parsed = await res.json();
    } catch {
      /* non-JSON error page */
    }
    const message = parsed.error?.message ?? `Request failed (${res.status}).`;
    const code = parsed.error?.code ?? "error";
    // A session that expired mid-use: let the session provider send them to sign in.
    if (res.status === 401 && code === "unauthenticated" && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHENTICATED_EVENT));
    }
    throw new ClientError(message, res.status, code);
  }

  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof ClientError ? err.message : "Something went wrong. Please try again.";
}
