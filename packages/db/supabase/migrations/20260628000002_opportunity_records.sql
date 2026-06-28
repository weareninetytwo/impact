-- Epic 2 deploy: flat opportunity_records table for MVP v0.2
-- Matches TypeScript Opportunity type — no company FK required for intake

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

ALTER TABLE opportunity_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunity_records_tenant_isolation ON opportunity_records
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Service role bypasses RLS; used by server until Supabase Auth is wired
