import type {
  LeadGrade,
  OpportunityInput,
  OpportunityStage,
  SignalType,
} from "@impact/shared";
import { getScoringConfig, type ScoringConfig } from "./scoring-config";

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

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function scoreValue(
  estimatedValue: number | null | undefined,
  config: ScoringConfig,
): number {
  if (estimatedValue == null || Number.isNaN(estimatedValue)) {
    return config.valueUnknownScore;
  }
  for (const tier of config.valueTiers) {
    if (estimatedValue >= tier.min) return tier.score;
  }
  return config.valueFloorScore;
}

function scoreUrgency(
  deadline: string | null | undefined,
  config: ScoringConfig,
): number {
  if (!deadline) return config.urgencyNoDeadlineScore;
  const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(days)) return config.urgencyNoDeadlineScore;
  if (days < 0) return config.urgencyOverdueScore;
  for (const tier of config.urgencyTiers) {
    if (days <= tier.maxDays) return tier.score;
  }
  return config.urgencyBeyondScore;
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

function scoreFit(input: ScoringInput, config: ScoringConfig): number {
  let base = config.fitBySignal[input.signal_type] ?? config.fitFallback;
  const text = `${input.title} ${input.signal_summary ?? ""} ${input.notes ?? ""}`.toLowerCase();

  for (const kw of config.boostKeywords) {
    if (text.includes(kw)) base += config.boostPoints;
  }
  for (const kw of config.penaltyKeywords) {
    if (text.includes(kw)) base -= config.penaltyPoints;
  }

  return clamp(base);
}

function assignGrade(
  total: number,
  fit: number,
  value: number,
  input: ScoringInput,
  config: ScoringConfig,
): LeadGrade {
  const text = `${input.notes ?? ""} ${input.signal_summary ?? ""}`.toLowerCase();
  const tireKicker =
    text.includes("no budget") ||
    text.includes("tire kicker") ||
    (input.estimated_value != null && input.estimated_value < config.tireKickerBelow);

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

/**
 * Deterministic scoring — no AI agents in Epic 2.
 * `config` defaults to the pack for `input.industry` (today: ninety two).
 */
export function scoreOpportunity(
  input: ScoringInput,
  config: ScoringConfig = getScoringConfig(input.industry),
): ScoringResult {
  const fit_score = scoreFit(input, config);
  const urgency_score = scoreUrgency(input.deadline, config);
  const value_score = scoreValue(input.estimated_value ?? null, config);
  const confidence_score = scoreConfidence(input);

  const total_score = clamp(
    fit_score * config.weights.fit +
      urgency_score * config.weights.urgency +
      value_score * config.weights.value +
      confidence_score * config.weights.confidence,
  );

  const lead_grade = assignGrade(total_score, fit_score, value_score, input, config);
  const offer = config.offerBySignal[input.signal_type] ?? config.defaultOffer;
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

/** Epic 3A: company + source_url, or company + title when no URL */
export function buildSignalIngestDedupeKey(
  companyName: string,
  sourceUrl?: string | null,
  opportunityTitle?: string | null,
): string {
  if (sourceUrl?.trim()) {
    return buildDedupeKey(companyName, null, sourceUrl);
  }
  const name = companyName.trim().toLowerCase().replace(/\s+/g, " ");
  const title = (opportunityTitle ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return `${name}::title::${title || "no-title"}`;
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
