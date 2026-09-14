CREATE TABLE IF NOT EXISTS research_report_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  lead_source text NOT NULL DEFAULT 'research_report',
  lead_magnet text NOT NULL DEFAULT 'ai_case_for_starting_now',
  cta_origin text NOT NULL DEFAULT 'why_ai_research_section',
  email_sent boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text
);
CREATE INDEX IF NOT EXISTS research_report_leads_email_idx ON research_report_leads (lower(email));
CREATE INDEX IF NOT EXISTS research_report_leads_created_at_idx ON research_report_leads (created_at DESC);
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS research_report_lead_id uuid REFERENCES research_report_leads(id);
CREATE INDEX IF NOT EXISTS website_leads_research_report_lead_id_idx ON website_leads (research_report_lead_id);
