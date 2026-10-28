CREATE TABLE IF NOT EXISTS games (
  code TEXT PRIMARY KEY,
  host_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  phase TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS games_created_at_idx ON games (created_at DESC);
