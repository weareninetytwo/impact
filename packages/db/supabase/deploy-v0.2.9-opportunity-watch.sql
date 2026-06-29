-- Impact v0.2.9 — Opportunity Watch Runner (Epic 3D)
-- Run after deploy-v0.2.8-enterprise-auth.sql (or v0.2.7 if auth skipped)

CREATE TABLE IF NOT EXISTS opportunity_watch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'running', 'success', 'partial', 'failed'
  )),
  sources_run INTEGER NOT NULL DEFAULT 0,
  found_count INTEGER NOT NULL DEFAULT 0,
  queued_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS opportunity_watch_runs_tenant_started_idx
  ON opportunity_watch_runs(tenant_id, started_at DESC);

ALTER TABLE opportunity_watch_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS opportunity_watch_runs_tenant ON opportunity_watch_runs;
CREATE POLICY opportunity_watch_runs_tenant ON opportunity_watch_runs
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- MVP: service role on server bypasses RLS
