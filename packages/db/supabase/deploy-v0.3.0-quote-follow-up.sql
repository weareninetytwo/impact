-- Impact v0.3.0 — Quote Follow-Up (Epic 5A, first slice of the Nurture Engine)
-- Run after deploy-v0.2.9-opportunity-watch.sql

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  job_type TEXT,
  amount NUMERIC(12, 2),
  description TEXT,
  quote_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  closed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'api')),
  external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_tenant_sent_idx
  ON quotes(tenant_id, quote_sent_at DESC);

-- Dedupe API imports from quoting tools
CREATE UNIQUE INDEX IF NOT EXISTS quotes_tenant_external_ref_idx
  ON quotes(tenant_id, external_ref)
  WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS quote_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'skipped', 'cancelled'
  )),
  drafted_by TEXT NOT NULL DEFAULT 'template' CHECK (drafted_by IN ('template', 'claude')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quote_id, step)
);

CREATE INDEX IF NOT EXISTS quote_follow_ups_tenant_due_idx
  ON quote_follow_ups(tenant_id, status, due_at);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_tenant ON quotes;
CREATE POLICY quotes_tenant ON quotes
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS quote_follow_ups_tenant ON quote_follow_ups;
CREATE POLICY quote_follow_ups_tenant ON quote_follow_ups
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- MVP: service role on server bypasses RLS
