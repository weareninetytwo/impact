-- Impact v0.2.6 — Signal import review queue (Epic 3B)
-- Run after deploy-v0.2.5-knowledge.sql

CREATE TABLE IF NOT EXISTS signal_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  opportunity_title TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_summary TEXT,
  source_name TEXT,
  source_url TEXT,
  deadline TEXT,
  estimated_value NUMERIC,
  location TEXT,
  fit_score NUMERIC,
  fit_notes TEXT,
  recommended_action TEXT,
  raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'merged', 'skipped'
  )),
  matched_opportunity_id UUID REFERENCES opportunity_records(id) ON DELETE SET NULL,
  created_opportunity_id UUID REFERENCES opportunity_records(id) ON DELETE SET NULL,
  created_knowledge_id UUID REFERENCES knowledge_items(id) ON DELETE SET NULL,
  import_source TEXT NOT NULL DEFAULT 'api' CHECK (import_source IN (
    'gpt', 'api', 'manual', 'scraper'
  )),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS signal_imports_tenant_status_idx
  ON signal_imports(tenant_id, status);

CREATE INDEX IF NOT EXISTS signal_imports_tenant_created_idx
  ON signal_imports(tenant_id, created_at DESC);

ALTER TABLE signal_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signal_imports_tenant ON signal_imports;
CREATE POLICY signal_imports_tenant ON signal_imports
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- MVP: service role on server bypasses RLS (same as opportunity_records)
