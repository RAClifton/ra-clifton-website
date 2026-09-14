CREATE TABLE IF NOT EXISTS website_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_origin text,
  referred_by text,
  referral_code text NOT NULL,
  ip_address text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS website_leads_email_idx ON website_leads (lower(email));
CREATE INDEX IF NOT EXISTS website_leads_referral_code_idx ON website_leads (referral_code);
CREATE INDEX IF NOT EXISTS website_leads_referred_by_idx ON website_leads (referred_by);
