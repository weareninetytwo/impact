import { randomUUID } from "crypto";
import type { Opportunity, OpportunityInput } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { scoreOpportunity, type ScoringResult } from "@impact/engines";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function totalFromScores(scored: ScoringResult): number {
  return clamp(
    scored.fit_score * 0.35 +
      scored.urgency_score * 0.25 +
      scored.value_score * 0.25 +
      scored.confidence_score * 0.15,
  );
}

export function buildOpportunityRecord(
  input: OpportunityInput,
  existing?: Opportunity,
  options?: {
    fit_score?: number;
    recommended_action?: string;
  },
): Opportunity {
  const scored = scoreOpportunity(input);

  if (options?.fit_score != null && !Number.isNaN(options.fit_score)) {
    scored.fit_score = clamp(options.fit_score);
    scored.total_score = Math.round(totalFromScores(scored) * 10) / 10;
  }

  if (options?.recommended_action?.trim()) {
    scored.recommended_action = options.recommended_action.trim();
  }

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
