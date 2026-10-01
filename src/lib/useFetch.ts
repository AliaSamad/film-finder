"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ClientError } from "@/lib/client";

type FetchState<T> = {
  data: T | null;
  error: ClientError | null;
  loading: boolean;
};

// GETs `path` and tracks loading / error / data. Pass null to stay idle.
// Changing `path` refetches; `reload()` retries the current request.
export function useFetch<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: Omit<FetchState<T>, "loading"> } | null>(null);

  const key = path === null ? null : `${path}#${attempt}`;

  useEffect(() => {
    if (path === null || key === null) return;
    const controller = new AbortController();
    api<T>("GET", path, undefined, controller.signal)
      .then((data) => setResult({ key, state: { data, error: null } }))
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        const error =
          err instanceof ClientError ? err : new ClientError("Something went wrong.", 0, "unknown");
        setResult({ key, state: { data: null, error } });
      });
    return () => controller.abort();
  }, [path, key]);

  // Loading whenever the latest result isn't for the current request.
  const settled = key !== null && result?.key === key ? result.state : null;
  const loading = key !== null && settled === null;

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Lets callers patch fetched data locally after a successful mutation.
  const setData = useCallback(
    (update: (prev: T) => T) =>
      setResult((r) =>
        r && r.state.data !== null
          ? { key: r.key, state: { data: update(r.state.data), error: null } }
          : r,
      ),
    [],
  );

  return {
    data: settled?.data ?? null,
    error: settled?.error ?? null,
    loading,
    reload,
    setData,
  } satisfies FetchState<T> & { reload: () => void; setData: (u: (p: T) => T) => void };
}
