CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  author text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insights_slug_idx ON insights (slug);
CREATE INDEX IF NOT EXISTS insights_status_published_at_idx ON insights (status, published_at DESC);
CREATE INDEX IF NOT EXISTS insights_created_at_idx ON insights (created_at DESC);
