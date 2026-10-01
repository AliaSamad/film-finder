import Link from "next/link";
import { Poster } from "@/components/Poster";
import type { FilmSummary } from "@/lib/types";

export function FilmCard({
  film,
  badge,
  footer,
}: {
  film: Pick<FilmSummary, "id" | "title" | "posterPath" | "year">;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="card">
      <Link href={`/film/${film.id}`} className="card-link">
        <div className="poster-wrap">
          <Poster title={film.title} path={film.posterPath} />
          {badge && <span className="badge">{badge}</span>}
        </div>
        <h3 className="card-title">{film.title}</h3>
        <p className="muted card-sub">{film.year ?? "Year unknown"}</p>
      </Link>
      {footer && <div className="card-footer">{footer}</div>}
    </article>
  );
}
