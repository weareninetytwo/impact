-- Impact v0.2.8 — Enterprise auth + lead ownership
-- Run after deploy-v0.2.7-scout.sql

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

-- Lead ownership: personal vs team visibility
ALTER TABLE opportunity_records
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opportunity_records_tenant_owner_idx
  ON opportunity_records(tenant_id, owner_user_id);

ALTER TABLE signal_imports
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS signal_imports_tenant_owner_idx
  ON signal_imports(tenant_id, owner_user_id);

-- Tenant billing placeholder (SaaS readiness)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial';

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'active';

COMMENT ON COLUMN opportunity_records.owner_user_id IS
  'Primary owner for My leads filter; null = unassigned team lead';

COMMENT ON COLUMN signal_imports.owner_user_id IS
  'Assigned reviewer/owner when import is queued';
