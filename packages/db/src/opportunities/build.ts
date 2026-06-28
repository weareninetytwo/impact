import { randomUUID } from "crypto";
import type { Opportunity, OpportunityInput } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { scoreOpportunity } from "@impact/engines";

export function buildOpportunityRecord(
  input: OpportunityInput,
  existing?: Opportunity,
): Opportunity {
  const scored = scoreOpportunity(input);
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? randomUUID(),
    tenant_id: existing?.tenant_id ?? DEFAULT_TENANT_ID,
    company_name: input.company_name.trim(),
    company_website: input.company_website?.trim() || null,
    title: input.title.trim(),
    stage: input.stage ?? existing?.stage ?? "new",
    lead_grade: scored.lead_grade,
    signal_type: input.signal_type,
    source: input.source.trim(),
    source_url: input.source_url?.trim() || null,
    signal_summary: input.signal_summary?.trim() || null,
    deadline: input.deadline?.trim() || null,
    estimated_value: input.estimated_value ?? null,
    fit_score: scored.fit_score,
    urgency_score: scored.urgency_score,
    value_score: scored.value_score,
    confidence_score: scored.confidence_score,
    total_score: scored.total_score,
    next_action: scored.next_action,
    recommended_action: scored.recommended_action,
    notes: input.notes?.trim() || null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}
