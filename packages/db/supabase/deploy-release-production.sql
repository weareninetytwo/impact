-- Impact production release bundle
-- Run entire file in Supabase SQL Editor (in order)
-- Includes: Scout (3C) + Enterprise Auth + Opportunity Watch (3D)

-- ========== v0.2.7 Scout ==========

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

-- ========== v0.2.8 Enterprise Auth ==========

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'bd_rep' CHECK (role IN ('owner', 'admin', 'bd_rep', 'viewer')),
  avatar_url TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_idx ON users(tenant_id, email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_tenant ON users;
CREATE POLICY users_tenant ON users
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

ALTER TABLE opportunity_records
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opportunity_records_tenant_owner_idx
  ON opportunity_records(tenant_id, owner_user_id);

ALTER TABLE signal_imports
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS signal_imports_tenant_owner_idx
  ON signal_imports(tenant_id, owner_user_id);

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial';

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'active';

-- ========== v0.2.9 Opportunity Watch ==========

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
