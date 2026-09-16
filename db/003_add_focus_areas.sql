-- v14.2: capture which improvement areas a lead selected in the
-- "Not sure where to start?" chips before they submitted the form.
ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb;
