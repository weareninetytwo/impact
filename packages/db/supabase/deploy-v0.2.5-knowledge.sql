-- Impact v0.2.5 — Knowledge Engine
-- Run after deploy-v0.2.sql

-- Knowledge items (proposals, RFPs, SOPs, rates, etc.)
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'proposal', 'rfp', 'case_study', 'sop', 'rate_sheet', 'brand_guide',
    'template', 'faq', 'capabilities', 'other'
  )),
  source TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  content_text TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_path TEXT,
  mime_type TEXT,
  chunk_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_items_tenant_type_idx
  ON knowledge_items(tenant_id, type);

CREATE INDEX IF NOT EXISTS knowledge_items_tenant_title_idx
  ON knowledge_items(tenant_id, title);

DROP TRIGGER IF EXISTS knowledge_items_updated_at ON knowledge_items;
CREATE TRIGGER knowledge_items_updated_at
  BEFORE UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Searchable chunks (keyword retrieval MVP; embedding column later)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  -- embedding vector(1536) NULL,  -- Epic 2.5+ : enable with pgvector
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (knowledge_item_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_item_idx
  ON knowledge_chunks(knowledge_item_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_tenant_idx
  ON knowledge_chunks(tenant_id);

-- Link knowledge to opportunities
CREATE TABLE IF NOT EXISTS opportunity_knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunity_records(id) ON DELETE CASCADE,
  knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, knowledge_item_id)
);

CREATE INDEX IF NOT EXISTS opp_knowledge_opp_idx
  ON opportunity_knowledge_links(opportunity_id);

CREATE INDEX IF NOT EXISTS opp_knowledge_item_idx
  ON opportunity_knowledge_links(knowledge_item_id);

ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_knowledge_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_items_tenant ON knowledge_items;
CREATE POLICY knowledge_items_tenant ON knowledge_items
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS knowledge_chunks_tenant ON knowledge_chunks;
CREATE POLICY knowledge_chunks_tenant ON knowledge_chunks
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS opp_knowledge_tenant ON opportunity_knowledge_links;
CREATE POLICY opp_knowledge_tenant ON opportunity_knowledge_links
  FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- MVP: service role on server bypasses RLS (same as opportunity_records)
