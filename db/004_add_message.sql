-- v14.3: capture the optional free-text message a lead leaves in the
-- "Interested in Our Assessments?" form. Capped at 1,000 characters
-- client-side and in the zod schema; the column is left unconstrained
-- text so a future limit change needs no migration.
ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS message text;
