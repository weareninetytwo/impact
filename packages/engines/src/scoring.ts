import type {
  LeadGrade,
  OpportunityInput,
  OpportunityStage,
  SignalType,
} from "@impact/shared";

export interface ScoringInput extends OpportunityInput {
  industry?: string | null;
}

export interface ScoringResult {
  fit_score: number;
  urgency_score: number;
  value_score: number;
  confidence_score: number;
  total_score: number;
  lead_grade: LeadGrade;
  recommended_action: string;
  next_action: string;
  suggested_stage: OpportunityStage;
}

const FIT_BY_SIGNAL: Record<SignalType, number> = {
  rfp: 92,
  expansion: 88,
  signage: 86,
  website_redesign: 84,
  funding: 82,
  agency_partner: 78,
  apollo: 72,
  news: 68,
  hiring: 62,
  other: 50,
};

const OFFER_BY_SIGNAL: Partial<Record<SignalType, string>> = {
  rfp: "Custom Enterprise / RFP Pursuit",
  expansion: "Brand Rollout Package",
  signage: "Signage + Environmental Graphics",
  website_redesign: "Website Audit / Redesign Sprint",
  funding: "Brand Strategy Sprint",
  agency_partner: "White-label Partner Program",
  hiring: "Employer Brand / Recruiting Campaign",
  apollo: "Brand Strategy Sprint",
  news: "Brand Strategy Sprint",
  other: "Brand Strategy Sprint",
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function scoreValue(estimatedValue: number | null | undefined): number {
  if (estimatedValue == null || Number.isNaN(estimatedValue)) return 42;
  if (estimatedValue >= 150000) return 95;
  if (estimatedValue >= 100000) return 88;
  if (estimatedValue >= 50000) return 75;
  if (estimatedValue >= 25000) return 62;
  if (estimatedValue >= 10000) return 48;
  return 28;
}

function scoreUrgency(deadline: string | null | undefined): number {
  if (!deadline) return 38;
  const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(days)) return 38;
  if (days < 0) return 90;
  if (days <= 7) return 95;
  if (days <= 14) return 85;
  if (days <= 30) return 72;
  if (days <= 90) return 55;
  return 40;
}

function scoreConfidence(input: ScoringInput): number {
  let score = 35;
  if (input.company_website?.trim()) score += 15;
  if (input.source_url?.trim()) score += 15;
  if (input.signal_summary?.trim()) score += 15;
  if (input.estimated_value != null && input.estimated_value > 0) score += 10;
  if (input.deadline?.trim()) score += 10;
  return clamp(score);
}

function scoreFit(input: ScoringInput): number {
  let base = FIT_BY_SIGNAL[input.signal_type] ?? 50;
  const text = `${input.title} ${input.signal_summary ?? ""} ${input.notes ?? ""}`.toLowerCase();

  const boostKeywords = [
    "rebrand",
    "brand",
    "website",
    "signage",
    "rfp",
    "rollout",
    "fleet",
    "identity",
  ];
  const penaltyKeywords = ["print only", "logo only", "free", "spec work", "student"];

  for (const kw of boostKeywords) {
    if (text.includes(kw)) base += 2;
  }
  for (const kw of penaltyKeywords) {
    if (text.includes(kw)) base -= 8;
  }

  return clamp(base);
}

function assignGrade(
  total: number,
  fit: number,
  value: number,
  input: ScoringInput,
): LeadGrade {
  const text = `${input.notes ?? ""} ${input.signal_summary ?? ""}`.toLowerCase();
  const tireKicker =
    text.includes("no budget") ||
    text.includes("tire kicker") ||
    (input.estimated_value != null && input.estimated_value < 5000);

  if (tireKicker || (fit < 35 && value < 35)) return "D";
  if (total >= 80 && fit >= 72 && value >= 60) return "A";
  if (total >= 64 && fit >= 55) return "B";
  if (total >= 40) return "C";
  return "D";
}

function recommendAction(
  grade: LeadGrade,
  signalType: SignalType,
  offer: string,
): string {
  switch (grade) {
    case "A":
      return `Book qualified discovery call — lead with ${offer}`;
    case "B":
      return `Confirm budget, timeline, and decision maker — then move to outreach for ${offer}`;
    case "C":
      return `Enroll in nurture — gather qualification data before human time on ${signalType} lead`;
    case "D":
      return "Skip or reactivation queue — do not assign closer time";
  }
}

function defaultNextAction(
  grade: LeadGrade,
  provided?: string,
): string {
  if (provided?.trim()) return provided.trim();
  switch (grade) {
    case "A":
      return "Review scoring breakdown and book qualified discovery call";
    case "B":
      return "Validate budget and timeline — then approve outreach draft";
    case "C":
      return "Add to nurture — confirm project need and budget range";
    case "D":
      return "Mark skip or schedule 90-day reactivation check";
  }
}

function suggestStage(grade: LeadGrade): OpportunityStage {
  switch (grade) {
    case "A":
      return "ready_for_outreach";
    case "B":
      return "contact_needed";
    case "C":
      return "nurturing";
    case "D":
      return "skip";
  }
}

/** Deterministic scoring — no AI agents in Epic 2 */
export function scoreOpportunity(input: ScoringInput): ScoringResult {
  const fit_score = scoreFit(input);
  const urgency_score = scoreUrgency(input.deadline);
  const value_score = scoreValue(input.estimated_value ?? null);
  const confidence_score = scoreConfidence(input);

  const total_score = clamp(
    fit_score * 0.35 +
      urgency_score * 0.25 +
      value_score * 0.25 +
      confidence_score * 0.15,
  );

  const lead_grade = assignGrade(total_score, fit_score, value_score, input);
  const offer = OFFER_BY_SIGNAL[input.signal_type] ?? "Brand Strategy Sprint";
  const recommended_action = recommendAction(lead_grade, input.signal_type, offer);
  const next_action = defaultNextAction(lead_grade, input.next_action);
  const suggested_stage = suggestStage(lead_grade);

  return {
    fit_score: Math.round(fit_score * 10) / 10,
    urgency_score: Math.round(urgency_score * 10) / 10,
    value_score: Math.round(value_score * 10) / 10,
    confidence_score: Math.round(confidence_score * 10) / 10,
    total_score: Math.round(total_score * 10) / 10,
    lead_grade,
    recommended_action,
    next_action,
    suggested_stage,
  };
}

export function buildDedupeKey(
  companyName: string,
  companyWebsite?: string | null,
  sourceUrl?: string | null,
): string {
  const name = companyName.trim().toLowerCase().replace(/\s+/g, " ");
  const url = normalizeUrl(companyWebsite || sourceUrl || "");
  return `${name}::${url || "no-url"}`;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "").split("/")[0] ?? trimmed;
  }
}
