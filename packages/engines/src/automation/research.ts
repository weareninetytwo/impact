import type { Opportunity } from "@impact/shared";
import type { ResearchArtifact } from "@impact/shared";

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

export function generateResearch(
  opportunity: Opportunity,
  knowledgeSnippets: string[] = [],
): ResearchArtifact {
  const offer =
    OFFER_BY_SIGNAL[opportunity.signal_type] ?? "Brand Strategy Sprint";
  const summary =
    opportunity.signal_summary?.trim() ||
    `${opportunity.company_name} — ${opportunity.title}`;

  const painPoints: string[] = [];
  if (opportunity.signal_type === "website_redesign" || opportunity.signal_type === "rfp") {
    painPoints.push("Legacy digital experience may not support conversion or accessibility goals");
    painPoints.push("Internal team bandwidth for RFP response and vendor selection");
  }
  if (opportunity.signal_type === "expansion" || opportunity.signal_type === "signage") {
    painPoints.push("Brand consistency across new locations or touchpoints");
    painPoints.push("Speed-to-market vs. quality tension during rollout");
  }
  if (painPoints.length === 0) {
    painPoints.push("Need for specialized brand/digital partner without adding headcount");
    painPoints.push("Timeline pressure on marketing or procurement");
  }

  const knowledgeHook =
    knowledgeSnippets[0]?.slice(0, 120) ??
    "similar growth-stage brand and digital programs";

  return {
    company_summary: `${opportunity.company_name} is pursuing ${opportunity.title.replace(/\.$/, "")}. Signal source: ${opportunity.source}.`,
    pain_points: painPoints,
    recommended_first_fix:
      opportunity.signal_type === "website_redesign"
        ? "Lead with a focused UX/accessibility audit and phased redesign scope"
        : `Lead with ${offer} scoped to their stated initiative`,
    outreach_angle: `Reference their active initiative and tie to ninety two's work on ${knowledgeHook}.`,
  };
}
