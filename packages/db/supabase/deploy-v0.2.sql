-- Impact v0.2 — Run this entire file in Supabase SQL Editor
-- Order: tenants → opportunity_records (MVP persistence)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO tenants (id, name, slug, settings)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'ninety two',
  'ninety-two',
  '{"services": ["Brand Strategy", "Visual Identity", "Website Design"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Epic 2 opportunity_records (flat intake model)
CREATE TABLE IF NOT EXISTS opportunity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN (
    'new', 'reviewed', 'contact_needed', 'ready_for_outreach', 'nurturing',
    'call_booked', 'proposal', 'won', 'lost', 'skip'
  )),
  lead_grade TEXT NOT NULL CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  signal_type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  signal_summary TEXT,
  deadline TIMESTAMPTZ,
  estimated_value NUMERIC(12,2),
  fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  urgency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  value_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  next_action TEXT NOT NULL DEFAULT 'Review new opportunity',
  recommended_action TEXT NOT NULL DEFAULT '',
  notes TEXT,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS opportunity_records_tenant_score_idx
  ON opportunity_records(tenant_id, total_score DESC);

CREATE INDEX IF NOT EXISTS opportunity_records_tenant_stage_idx
  ON opportunity_records(tenant_id, stage);

DROP TRIGGER IF EXISTS opportunity_records_updated_at ON opportunity_records;
CREATE TRIGGER opportunity_records_updated_at
  BEFORE UPDATE ON opportunity_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE opportunity_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS opportunity_records_tenant_isolation ON opportunity_records;
CREATE POLICY opportunity_records_tenant_isolation ON opportunity_records
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- MVP uses service role on server (bypasses RLS). Auth + RLS wired in a later epic.
