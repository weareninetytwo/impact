import type { Opportunity } from "@impact/shared";
import type { QualificationArtifact } from "@impact/shared";

export function generateQualification(
  opportunity: Opportunity,
): QualificationArtifact {
  const grade = opportunity.lead_grade;
  const qualified = grade === "A" || grade === "B";

  const discoveryQuestions =
    grade === "A" || grade === "B"
      ? [
          "Who owns budget and final vendor selection?",
          "What is the decision timeline and any hard deadlines?",
          "What does success look like at 90 days post-award?",
        ]
      : [
          "Is there an allocated budget for this initiative?",
          "What triggered this project now vs. next quarter?",
        ];

  const disqualifyReasons: string[] = [];
  if (grade === "D") {
    disqualifyReasons.push("Low fit and value scores — do not assign closer time");
  }
  if (
    opportunity.estimated_value != null &&
    opportunity.estimated_value < 10000 &&
    grade !== "A"
  ) {
    disqualifyReasons.push("Estimated value below typical ninety two engagement threshold");
  }

  return {
    qualified,
    grade,
    summary: qualified
      ? `${opportunity.company_name} qualifies for human outreach — grade ${grade} with score ${opportunity.total_score.toFixed(1)}.`
      : `${opportunity.company_name} should stay in nurture or skip — grade ${grade}.`,
    discovery_questions: discoveryQuestions,
    disqualify_reasons: disqualifyReasons,
  };
}
