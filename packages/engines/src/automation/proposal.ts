import type { Opportunity } from "@impact/shared";
import type {
  CloserBriefArtifact,
  ProposalArtifact,
  ResearchArtifact,
} from "@impact/shared";

export function generateProposal(
  opportunity: Opportunity,
  research: ResearchArtifact,
  brief: CloserBriefArtifact,
): ProposalArtifact {
  const value =
    opportunity.estimated_value ??
    (opportunity.lead_grade === "A" ? 125000 : 75000);

  const content = `# ${opportunity.company_name} — ${brief.suggested_offer}

## Executive summary
${research.company_summary}

## Understanding your need
${brief.signal_summary}

## Why ninety two
ninety two partners with growth-stage organizations on brand strategy, digital experience, and campaign creative. ${research.recommended_first_fix}.

## Recommended approach
1. **Discovery & alignment** — validate scope, stakeholders, and success metrics  
2. **Strategy sprint** — ${brief.proposal_angle}  
3. **Execution** — phased delivery aligned to ${brief.why_now.toLowerCase()}

## Investment range
Estimated engagement value: **$${value.toLocaleString("en-US")}** (refine after discovery).

## Next step
15-minute qualification call to confirm fit, timeline, and decision process.

---
Prepared by Impact · ninety two`;

  return {
    title: `${opportunity.company_name} — ${brief.suggested_offer}`,
    content,
    estimated_value: value,
  };
}
