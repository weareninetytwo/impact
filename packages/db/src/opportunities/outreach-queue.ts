import type { LeadGrade, Opportunity } from "@impact/shared";
import { isSupabasePersistenceEnabled } from "../client";
import { readOpportunities } from "./store";
import { supabaseListOpportunities } from "./supabase-store";

const GRADE_RANK: Record<LeadGrade, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

const CLOSED_STAGES = new Set(["won", "lost", "skip"]);

function sortOutreachQueue(a: Opportunity, b: Opportunity): number {
  const gradeDiff = GRADE_RANK[a.lead_grade] - GRADE_RANK[b.lead_grade];
  if (gradeDiff !== 0) return gradeDiff;

  const stageRank = (o: Opportunity) =>
    o.stage === "ready_for_outreach" ? 0 : o.stage === "contact_needed" ? 1 : 2;
  const stageDiff = stageRank(a) - stageRank(b);
  if (stageDiff !== 0) return stageDiff;

  return b.total_score - a.total_score;
}

export async function listOutreachQueue(): Promise<Opportunity[]> {
  const items = isSupabasePersistenceEnabled()
    ? await supabaseListOpportunities()
    : await readOpportunities();

  return items
    .filter((o) => !CLOSED_STAGES.has(o.stage))
    .filter((o) => o.lead_grade === "A" || o.lead_grade === "B" || o.lead_grade === "C")
    .sort(sortOutreachQueue);
}
