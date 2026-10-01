import { createServer } from "node:http";

// A tiny stand-in for the TMDB v3 API, for developing and testing offline.
//   npx tsx scripts/mock-tmdb.ts
// then set TMDB_BASE_URL=http://localhost:4010 and TMDB_READ_TOKEN=anything.

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
];

// Deterministic fixture: film i gets 1-3 genres from a rotating pattern.
const FILMS = Array.from({ length: 80 }, (_, i) => {
  const id = 1000 + i;
  const genres = [...new Set([0, 3, 7].slice(0, (i % 3) + 1).map((k) => GENRES[(i * 5 + k) % GENRES.length]))];
  return {
    id,
    title: `Mock Film ${i + 1}`,
    poster_path: i % 4 === 0 ? null : `/mock${id}.jpg`,
    backdrop_path: null,
    release_date: `${1980 + (i % 45)}-06-01`,
    overview: `Overview of mock film ${i + 1}.`,
    vote_average: 5 + ((i * 7) % 40) / 10,
    vote_count: 500 + i,
    runtime: 80 + (i % 60),
    tagline: i % 2 ? `Tagline ${i + 1}` : "",
    genres,
    genre_ids: genres.map((g) => g.id),
  };
});

const PAGE_SIZE = 20;
const paginate = <T,>(items: T[], page: number) => ({
  page,
  total_pages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
  total_results: items.length,
  results: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
});

const send = (res: import("node:http").ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const page = Number(url.searchParams.get("page") ?? 1);

  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return send(res, 401, { status_message: "Invalid API key" });
  }

  if (url.pathname === "/genre/movie/list") return send(res, 200, { genres: GENRES });

  if (url.pathname === "/search/movie") {
    const q = (url.searchParams.get("query") ?? "").toLowerCase();
    return send(res, 200, paginate(FILMS.filter((f) => f.title.toLowerCase().includes(q)), page));
  }

  if (url.pathname === "/discover/movie") {
    const wanted = (url.searchParams.get("with_genres") ?? "").split("|").map(Number);
    const matches = FILMS.filter((f) => f.genre_ids.some((g) => wanted.includes(g)));
    return send(res, 200, paginate(matches, page));
  }

  const m = url.pathname.match(/^\/movie\/(\d+)$/);
  if (m) {
    const film = FILMS.find((f) => f.id === Number(m[1]));
    return film ? send(res, 200, film) : send(res, 404, { status_message: "Not found" });
  }

  send(res, 404, { status_message: "Not found" });
}).listen(4010, () => console.log("mock TMDB listening on http://localhost:4010"));
