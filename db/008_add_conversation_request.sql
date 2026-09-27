-- v14.4: a lead can ask to be contacted to arrange a conversation.
--
-- Deliberately narrow. One additive column on one table, defaulted so every
-- existing row is valid without a backfill and code that predates this column
-- keeps inserting successfully. This database also hosts an unrelated
-- application; nothing here touches it.
ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS wants_conversation boolean NOT NULL DEFAULT false;
