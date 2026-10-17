import type { SignalType } from "@impact/shared";

/** Everything industry-specific about scoring and offer routing. */
export interface ScoringConfig {
  id: string;
  /** Base fit score per signal type; unlisted types use `fitFallback`. */
  fitBySignal: Record<SignalType, number>;
  fitFallback: number;
  boostKeywords: string[];
  boostPoints: number;
  penaltyKeywords: string[];
  penaltyPoints: number;
  /** Offer routed per signal type; unlisted types use `defaultOffer`. */
  offerBySignal: Partial<Record<SignalType, string>>;
  defaultOffer: string;
  /** Highest `min` wins: first tier whose min the value meets. Sorted desc. */
  valueTiers: { min: number; score: number }[];
  valueFloorScore: number;
  valueUnknownScore: number;
  /** Estimated value below this is treated as a tire-kicker (grade D). */
  tireKickerBelow: number;
  /** Days until deadline: first tier whose maxDays the gap is within. Sorted asc. */
  urgencyTiers: { maxDays: number; score: number }[];
  urgencyOverdueScore: number;
  urgencyBeyondScore: number;
  urgencyNoDeadlineScore: number;
  weights: { fit: number; urgency: number; value: number; confidence: number };
}

/** ninety two (branding & signage) — reproduces the original hard-coded scoring. */
export const NINETY_TWO_SCORING_CONFIG: ScoringConfig = {
  id: "ninety-two-default",
  fitBySignal: {
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
  },
  fitFallback: 50,
  boostKeywords: [
    "rebrand",
    "brand",
    "website",
    "signage",
    "rfp",
    "rollout",
    "fleet",
    "identity",
  ],
  boostPoints: 2,
  penaltyKeywords: ["print only", "logo only", "free", "spec work", "student"],
  penaltyPoints: 8,
  offerBySignal: {
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
  },
  defaultOffer: "Brand Strategy Sprint",
  valueTiers: [
    { min: 150000, score: 95 },
    { min: 100000, score: 88 },
    { min: 50000, score: 75 },
    { min: 25000, score: 62 },
    { min: 10000, score: 48 },
  ],
  valueFloorScore: 28,
  valueUnknownScore: 42,
  tireKickerBelow: 5000,
  urgencyTiers: [
    { maxDays: 7, score: 95 },
    { maxDays: 14, score: 85 },
    { maxDays: 30, score: 72 },
    { maxDays: 90, score: 55 },
  ],
  urgencyOverdueScore: 90,
  urgencyBeyondScore: 40,
  urgencyNoDeadlineScore: 38,
  weights: { fit: 0.35, urgency: 0.25, value: 0.25, confidence: 0.15 },
};

const CONFIGS_BY_INDUSTRY: Record<string, ScoringConfig> = {};

/**
 * Resolve the scoring config for an industry. Phase 0: every industry gets the
 * ninety two default, so behavior is unchanged. Packs register here later.
 */
export function getScoringConfig(industry?: string | null): ScoringConfig {
  return (industry && CONFIGS_BY_INDUSTRY[industry]) || NINETY_TWO_SCORING_CONFIG;
}
