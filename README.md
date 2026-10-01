# Film Finder

A full-stack film discovery app. Search films (data from [TMDB](https://www.themoviedb.org/)), rate them, keep a watchlist, pick 5–10 favourites, and get recommendations based on the genres you like.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL (`pg`) · Zod · `jose` (JWT sessions) · `bcryptjs` · Vitest

## Features

- **Accounts** – register / sign in / sign out with hashed passwords (bcrypt) and a signed, httpOnly session cookie.
- **Search & browse** – TMDB search with pagination; search state lives in the URL so the back button works.
- **Ratings** – score any film 1–10; change or clear it later.
- **Watchlist** – save films for later.
- **Favourites** – choose 5–10 films you love (enforced server-side, including under concurrent requests).
- **Recommendations** – genre-overlap scoring against your favourites (see below), each result showing its match % and the genres it shares with your taste.
- **Loading & error states everywhere** – skeleton grids while lists load, spinners for page loads, inline pending/error text on every button that calls the API, retry buttons on failed loads, a connectivity message when the network is down, and graceful handling of an expired session.

## Getting started

Requires Node 20+ (developed on 22) and Docker (or any PostgreSQL 14+).

```bash
npm install

# 1. Start Postgres (matches the default DATABASE_URL in .env.example)
docker compose up -d

# 2. Configure environment
cp .env.example .env.local
#   - TMDB_READ_TOKEN: free "API Read Access Token" from https://www.themoviedb.org/settings/api
#   - SESSION_SECRET:  openssl rand -base64 32

# 3. Create the tables
npm run db:migrate

# 4. Run it
npm run dev        # http://localhost:3000
```

### Developing without a TMDB token

`scripts/mock-tmdb.ts` is a small stand-in for the TMDB API with 80 fake films:

```bash
npx tsx scripts/mock-tmdb.ts    # in one terminal
```

then in `.env.local` set `TMDB_BASE_URL=http://localhost:4010` and `TMDB_READ_TOKEN=anything`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (recommendation engine) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply pending SQL files from `migrations/` |

## How recommendations work

Implemented as a pure function in [`src/lib/recommend.ts`](src/lib/recommend.ts) and covered by unit tests.

1. **Genre profile.** Each genre's weight is the fraction of your favourites that include it. If 4 of your 5 favourites are Sci-Fi, Sci-Fi weighs 0.8; a genre appearing once weighs 0.2.
2. **Candidate pool.** The API asks TMDB's `/discover/movie` for popular, well-voted films in any of your top 4 genres (3 pages, de-duplicated).
3. **Score.** Each candidate is scored by cosine similarity between your genre profile and the film's genres:
   `score = Σ weight(shared genres) / (‖profile‖ · √(number of film genres))`.
   Overlap on your strongest genres counts most, and films padded with many unrelated genres are slightly discounted. The score is between 0 and 1.
4. **Rank.** Sort by score, then TMDB rating, then id (deterministic). Your favourites and films you've already rated are excluded.

## Design notes

- **No ORM.** Plain SQL via `pg` with a ~40-line migration runner ([`scripts/migrate.ts`](scripts/migrate.ts)). The schema is small, and it keeps the SQL (upserts, `FOR UPDATE` locking) visible.
- **Server-side snapshots.** Clients send only a TMDB id. The server fetches the film from TMDB and stores title/poster/year (and genre ids for favourites) itself, so list pages need no TMDB calls and clients can't store arbitrary data.
- **Favourites cap.** `addFavourite` runs in a transaction that locks the user's row before counting, so parallel requests can't exceed 10.
- **Auth.** Session = HS256 JWT in an httpOnly, SameSite=Lax cookie (`Secure` in production). Login compares against a dummy hash for unknown emails so timing doesn't reveal which accounts exist. `src/proxy.ts` is a cheap first gate for page requests; every API route verifies the token itself.
- **One error shape.** All routes are wrapped by `route()` in [`src/lib/api.ts`](src/lib/api.ts), returning `{ error: { message, code } }`, so the UI can show a meaningful message for any failure.

## API

All routes except `/api/auth/*` require a signed-in user (401 otherwise).

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register` · `login` · `logout` | Account + session |
| `GET /api/auth/me` | Current user, or `{ user: null }` |
| `GET /api/films/search?q=&page=` | TMDB search |
| `GET /api/films/:id` | Film details + your rating/watchlist/favourite state |
| `GET /api/ratings` · `PUT/DELETE /api/ratings/:id` | Ratings (`PUT` body: `{ "rating": 1-10 }`) |
| `GET /api/watchlist` · `PUT/DELETE /api/watchlist/:id` | Watchlist |
| `GET /api/favourites` · `PUT/DELETE /api/favourites/:id` | Favourites (max 10) |
| `GET /api/recommendations` | Needs ≥ 5 favourites (409 `need_favourites` otherwise) |

## Project layout

```
migrations/            SQL schema (applied in filename order)
scripts/               migrate.ts, mock-tmdb.ts
src/proxy.ts           redirects cookie-less page requests to /login
src/lib/               db, session, users, lists (SQL), tmdb client, recommend (+ tests), API helpers
src/app/api/           route handlers
src/app/(auth)/        login, register
src/app/(app)/         discover, film/[id], favourites, watchlist, ratings, recommendations
src/components/        UI (film cards, buttons, loading/error components, session provider)
```

## Ideas for next steps

- Rate-limit login/register (e.g. per IP + email) and add email verification / password reset.
- Add integration tests for the API routes against a test database.
- Use TMDB keywords, directors or cast alongside genres to refine recommendations.
- Let users filter search by genre/year and sort their lists.
