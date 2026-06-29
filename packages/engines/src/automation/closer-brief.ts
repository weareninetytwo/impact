import type { Opportunity } from "@impact/shared";
import type {
  CloserBriefArtifact,
  QualificationArtifact,
  ResearchArtifact,
} from "@impact/shared";

const OFFER_BY_SIGNAL: Record<string, string> = {
  rfp: "Custom Enterprise / RFP Pursuit",
  expansion: "Brand Rollout Package",
  signage: "Signage + Environmental Graphics",
  website_redesign: "Website Audit / Redesign Sprint",
  funding: "Brand Strategy Sprint",
  agency_partner: "White-label Partner Program",
  hiring: "Employer Brand / Recruiting Campaign",
  news: "Brand Strategy Sprint",
  other: "Brand Strategy Sprint",
};

export function generateCloserBrief(
  opportunity: Opportunity,
  research: ResearchArtifact,
  qualification: QualificationArtifact,
): CloserBriefArtifact {
  const offer =
    OFFER_BY_SIGNAL[opportunity.signal_type] ?? "Brand Strategy Sprint";

  const whyNow =
    opportunity.deadline != null
      ? `Active deadline: ${new Date(opportunity.deadline).toLocaleDateString()}`
      : research.pain_points[0] ?? "Timely buying signal detected";

  return {
    company_summary: research.company_summary,
    signal_summary:
      opportunity.signal_summary?.trim() || opportunity.title,
    why_now: whyNow,
    project_type: offer,
    suggested_offer: offer,
    proposal_angle: `${offer} positioned around ${research.recommended_first_fix.toLowerCase()}`,
    discovery_questions: qualification.discovery_questions,
    objections_to_expect: [
      "Budget range and approval process",
      "Incumbent agency or internal team capacity",
      "Timeline vs. scope tradeoffs",
    ],
  };
}
