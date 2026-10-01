"use client";

import { api } from "@/lib/client";
import { useAction } from "@/lib/useAction";
import { InlineError } from "@/components/ui";

// 1-10 rating picker. Clicking the current rating clears it.
export function RatingControl({
  filmId,
  rating,
  onChange,
}: {
  filmId: number;
  rating: number | null;
  onChange: (next: number | null) => void;
}) {
  const { pending, error, run } = useAction();

  const choose = async (value: number) => {
    const clearing = value === rating;
    const done = await run(() =>
      clearing
        ? api("DELETE", `/api/ratings/${filmId}`)
        : api("PUT", `/api/ratings/${filmId}`, { rating: value }),
    );
    if (done !== undefined) onChange(clearing ? null : value);
  };

  return (
    <div className="rating">
      <div className="rating-head">
        <span className="label">Your rating</span>
        <span className="muted" aria-live="polite">
          {pending ? "Saving…" : rating ? `${rating}/10` : "Not rated"}
        </span>
      </div>
      <div className="rating-scale" role="group" aria-label="Rate this film from 1 to 10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`rating-btn ${rating !== null && n <= rating ? "on" : ""} ${n === rating ? "current" : ""}`}
            onClick={() => choose(n)}
            disabled={pending}
            aria-pressed={n === rating}
            aria-label={`${n} out of 10`}
          >
            {n}
          </button>
        ))}
      </div>
      <InlineError message={error} />
    </div>
  );
}
