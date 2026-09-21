CREATE TABLE IF NOT EXISTS insights_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_fields jsonb,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insights_audit_insight_id_idx ON insights_audit (insight_id);
CREATE INDEX IF NOT EXISTS insights_audit_changed_at_idx ON insights_audit (changed_at DESC);
