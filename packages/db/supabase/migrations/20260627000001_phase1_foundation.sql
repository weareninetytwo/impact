-- Impact Phase 1: Foundation
-- Core tables with tenant_id on every table for SaaS readiness

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Users (linked to auth.users.id when auth is wired)
CREATE TABLE users (
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

CREATE INDEX users_tenant_id_idx ON users(tenant_id);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  employee_count INTEGER,
  revenue_range TEXT,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  apollo_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX companies_tenant_domain_unique_idx
  ON companies(tenant_id, domain)
  WHERE domain IS NOT NULL;

CREATE INDEX companies_tenant_id_idx ON companies(tenant_id);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  title TEXT,
  linkedin_url TEXT,
  role_type TEXT CHECK (role_type IN ('decision_maker', 'influencer', 'champion')),
  apollo_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX contacts_tenant_company_idx ON contacts(tenant_id, company_id);
CREATE INDEX contacts_tenant_email_idx ON contacts(tenant_id, email);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Signals
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'rfp', 'funding', 'hiring', 'press_release', 'expansion',
    'fleet', 'leadership_change', 'website_change', 'other'
  )),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'matched', 'scored', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX signals_tenant_status_idx ON signals(tenant_id, status);
CREATE INDEX signals_tenant_type_idx ON signals(tenant_id, type);
CREATE INDEX signals_tenant_company_idx ON signals(tenant_id, company_id);

CREATE TRIGGER signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN (
    'new', 'researching', 'nurturing', 'qualified', 'outreach',
    'engaged', 'call_booked', 'proposal', 'negotiation', 'won', 'lost'
  )),
  lead_grade TEXT CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  readiness TEXT CHECK (readiness IN ('ready_now', 'ready_later', 'not_a_fit')),
  fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  revenue_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  urgency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  composite_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  estimated_value NUMERIC(12,2),
  recommended_services TEXT[] NOT NULL DEFAULT '{}',
  routed_offer TEXT,
  qualification JSONB,
  closer_brief_id UUID,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  research_summary TEXT,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_reason TEXT CHECK (closed_reason IN ('won', 'lost', 'disqualified')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX opportunities_tenant_stage_idx ON opportunities(tenant_id, stage);
CREATE INDEX opportunities_tenant_grade_idx ON opportunities(tenant_id, lead_grade);
CREATE INDEX opportunities_tenant_score_idx ON opportunities(tenant_id, composite_score DESC);
CREATE INDEX opportunities_tenant_assigned_idx ON opportunities(tenant_id, assigned_to);

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('opportunity', 'company', 'contact', 'signal')),
  entity_id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system', 'integration')),
  actor_id TEXT NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activities_tenant_entity_idx ON activities(tenant_id, entity_type, entity_id);
CREATE INDEX activities_tenant_created_idx ON activities(tenant_id, created_at DESC);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN (
    'follow_up', 'research', 'outreach', 'proposal', 'meeting', 'qualification', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_tenant_status_idx ON tasks(tenant_id, status);
CREATE INDEX tasks_tenant_assigned_due_idx ON tasks(tenant_id, assigned_to, due_at);
CREATE INDEX tasks_tenant_opportunity_idx ON tasks(tenant_id, opportunity_id);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security (tenant isolation)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies: tenant_id from JWT app_metadata (wired when auth is connected)
CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_companies ON companies
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_contacts ON contacts
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_signals ON signals
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_opportunities ON opportunities
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_activities ON activities
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_tasks ON tasks
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Seed ninety two tenant (optional local dev)
INSERT INTO tenants (id, name, slug, settings)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'ninety two',
  'ninety-two',
  '{"services": ["Brand Strategy", "Visual Identity", "Website Design"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
