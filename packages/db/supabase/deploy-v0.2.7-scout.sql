-- Impact v0.2.7 — Scheduled Scout (Epic 3C)
-- Run after deploy-v0.2.6-signal-imports.sql

CREATE TABLE IF NOT EXISTS scout_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'rss', 'html', 'manual_query', 'stub'
  )),
  url TEXT,
  query TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scout_sources_tenant_enabled_idx
  ON scout_sources(tenant_id, enabled);

CREATE TABLE IF NOT EXISTS scout_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES scout_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'running', 'success', 'partial', 'failed'
  )),
  found_count INTEGER NOT NULL DEFAULT 0,
  queued_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS scout_runs_source_started_idx
  ON scout_runs(source_id, started_at DESC);

ALTER TABLE scout_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scout_sources_tenant ON scout_sources;
CREATE POLICY scout_sources_tenant ON scout_sources
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS scout_runs_tenant ON scout_runs;
CREATE POLICY scout_runs_tenant ON scout_runs
  FOR ALL USING (
    source_id IN (
      SELECT id FROM scout_sources
      WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

-- MVP: service role on server bypasses RLS (same as signal_imports)
