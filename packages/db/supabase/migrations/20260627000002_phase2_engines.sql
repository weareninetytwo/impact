-- Impact Phase 2: Engines
-- closer_briefs, nurture_enrollments, proposals, workflows, integrations

-- Closer briefs (FK added to opportunities after table exists)
CREATE TABLE closer_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_summary TEXT NOT NULL DEFAULT '',
  signal_summary TEXT NOT NULL DEFAULT '',
  why_now TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT '',
  estimated_value NUMERIC(12,2),
  fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  urgency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  lead_grade TEXT CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  objections_raised JSONB NOT NULL DEFAULT '[]'::jsonb,
  previous_outreach JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_offer TEXT,
  discovery_questions TEXT[] NOT NULL DEFAULT '{}',
  proposal_angle TEXT,
  generated_by TEXT NOT NULL DEFAULT 'system',
  closer_rating INTEGER CHECK (closer_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX closer_briefs_tenant_opportunity_idx ON closer_briefs(tenant_id, opportunity_id);

CREATE TRIGGER closer_briefs_updated_at
  BEFORE UPDATE ON closer_briefs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_closer_brief_id_fkey
  FOREIGN KEY (closer_brief_id) REFERENCES closer_briefs(id) ON DELETE SET NULL;

-- Nurture enrollments
CREATE TABLE nurture_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'exited')),
  current_step INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX nurture_enrollments_tenant_opportunity_idx ON nurture_enrollments(tenant_id, opportunity_id);
CREATE INDEX nurture_enrollments_tenant_status_idx ON nurture_enrollments(tenant_id, status);

CREATE TRIGGER nurture_enrollments_updated_at
  BEFORE UPDATE ON nurture_enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'sent', 'accepted', 'declined')),
  content TEXT,
  template_id TEXT,
  estimated_value NUMERIC(12,2),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX proposals_tenant_status_idx ON proposals(tenant_id, status);
CREATE INDEX proposals_tenant_opportunity_idx ON proposals(tenant_id, opportunity_id);

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workflows_tenant_id_idx ON workflows(tenant_id);

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS for Phase 2 tables
ALTER TABLE closer_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurture_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_closer_briefs ON closer_briefs
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_nurture_enrollments ON nurture_enrollments
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_proposals ON proposals
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_workflows ON workflows
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY tenant_isolation_integrations ON integrations
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
