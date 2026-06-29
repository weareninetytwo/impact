-- Impact v0.3.0 — Pipeline artifacts for Stages 3–9 (research through automation)

CREATE TABLE IF NOT EXISTS pipeline_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'company', 'contact', 'research', 'qualification', 'closer_brief',
    'nurture', 'proposal', 'task', 'automation_run'
  )),
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_artifacts_tenant_type_idx
  ON pipeline_artifacts(tenant_id, artifact_type);

CREATE INDEX IF NOT EXISTS pipeline_artifacts_tenant_opp_type_idx
  ON pipeline_artifacts(tenant_id, opportunity_id, artifact_type);

CREATE INDEX IF NOT EXISTS pipeline_artifacts_tenant_created_idx
  ON pipeline_artifacts(tenant_id, created_at DESC);

ALTER TABLE pipeline_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pipeline_artifacts_tenant ON pipeline_artifacts;
CREATE POLICY pipeline_artifacts_tenant ON pipeline_artifacts
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
