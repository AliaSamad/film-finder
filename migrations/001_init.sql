CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emails are compared case-insensitively.
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

-- Films are identified by their TMDB id. We keep a small snapshot of the film
-- (title, poster, year) on each row so lists render without calling TMDB.

-- 5-10 favourite films that seed recommendations (limit enforced in the API).
CREATE TABLE favourites (
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tmdb_id     INTEGER     NOT NULL,
  title       TEXT        NOT NULL,
  poster_path TEXT,
  year        SMALLINT,
  genre_ids   INTEGER[]   NOT NULL DEFAULT '{}',
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tmdb_id)
);

CREATE TABLE ratings (
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tmdb_id     INTEGER     NOT NULL,
  title       TEXT        NOT NULL,
  poster_path TEXT,
  year        SMALLINT,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tmdb_id)
);

CREATE TABLE watchlist (
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tmdb_id     INTEGER     NOT NULL,
  title       TEXT        NOT NULL,
  poster_path TEXT,
  year        SMALLINT,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tmdb_id)
);

CREATE INDEX ratings_user_updated_idx   ON ratings   (user_id, updated_at DESC);
CREATE INDEX watchlist_user_added_idx   ON watchlist (user_id, added_at DESC);
CREATE INDEX favourites_user_added_idx  ON favourites (user_id, added_at);
