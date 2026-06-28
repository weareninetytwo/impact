-- Epic 2: Opportunity Intake + Scoring
-- Aligns opportunity stages and adds intake fields for file/Supabase parity

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS company_website TEXT,
  ADD COLUMN IF NOT EXISTS signal_type TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS signal_summary TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS value_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill total_score from composite_score if present
UPDATE opportunities
SET total_score = composite_score
WHERE total_score IS NULL AND composite_score IS NOT NULL;

UPDATE opportunities
SET value_score = revenue_score
WHERE value_score IS NULL AND revenue_score IS NOT NULL;

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_stage_check CHECK (stage IN (
    'new', 'reviewed', 'contact_needed', 'ready_for_outreach', 'nurturing',
    'call_booked', 'proposal', 'won', 'lost', 'skip'
  ));

-- next_action should not be null for active pipeline rows
ALTER TABLE opportunities
  ALTER COLUMN next_action SET DEFAULT 'Review new opportunity';

COMMENT ON COLUMN opportunities.total_score IS 'Epic 2 weighted score (fit, urgency, value, confidence)';
COMMENT ON COLUMN opportunities.value_score IS 'Epic 2 deal value score (formerly revenue_score)';
