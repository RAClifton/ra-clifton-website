-- Cover image for an insight. Nullable: posts without one fall back to a
-- palette gradient in the card, so existing rows need no backfill.
ALTER TABLE insights ADD COLUMN IF NOT EXISTS image_url text;
