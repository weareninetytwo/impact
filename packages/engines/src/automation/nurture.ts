import type { Opportunity } from "@impact/shared";
import type { NurtureArtifact } from "@impact/shared";

export function generateNurtureEnrollment(
  opportunity: Opportunity,
): NurtureArtifact {
  const sequenceName =
    opportunity.lead_grade === "C"
      ? "Grade C — qualification nurture"
      : "Grade D — reactivation queue";

  return {
    sequence_name: sequenceName,
    current_step: 1,
    total_steps: 3,
    next_touch: "Day 0: Share relevant case study + soft qualification question",
    status: "active",
  };
}

export function nurtureTouchContent(
  opportunity: Opportunity,
  step: number,
): string {
  const company = opportunity.company_name;
  switch (step) {
    case 1:
      return `Hi ${company} team — sharing a quick case study relevant to ${opportunity.title.toLowerCase()}. Would a short call help clarify if we're a fit?`;
    case 2:
      return `Following up — happy to answer questions on scope, timeline, or budget range for initiatives like yours.`;
    default:
      return `Closing the loop — should I keep you on our radar for Q3/Q4 brand or digital projects?`;
  }
}
