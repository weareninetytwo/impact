import type { AutomationRunSummary, Opportunity } from "@impact/shared";
import { buildOutreachDraft } from "../outreach-draft";

export function buildExecutiveBriefing(
  opportunities: Opportunity[],
  summary: Omit<AutomationRunSummary, "briefing">,
): string {
  const aGrades = opportunities.filter((o) => o.lead_grade === "A");
  const ready = opportunities.filter((o) => o.stage === "ready_for_outreach");

  const lines = [
    `**Overnight automation complete** — processed ${summary.opportunities_processed} opportunities.`,
    "",
    `- Scout sources run: ${summary.scout_sources_run}`,
    `- Imports approved: ${summary.imports_approved} · skipped: ${summary.imports_skipped}`,
    `- Research: ${summary.research_generated} · Qualified: ${summary.qualified}`,
    `- Closer briefs: ${summary.briefs_generated} · Proposals: ${summary.proposals_generated}`,
    `- Nurture enrolled: ${summary.nurture_enrolled} · Tasks: ${summary.tasks_created}`,
    `- Outreach drafts prepared: ${summary.outreach_drafts_prepared}`,
    "",
    `**${aGrades.length} A-grade opportunities** require action today.`,
  ];

  for (const opp of aGrades.slice(0, 5)) {
    lines.push(`- ${opp.company_name}: ${opp.title} (score ${opp.total_score.toFixed(1)})`);
  }

  if (ready.length > 0) {
    lines.push("", `**${ready.length} leads ready for outreach** — open /outreach to send.`);
  }

  if (summary.errors.length > 0) {
    lines.push("", `⚠ ${summary.errors.length} non-fatal error(s) during run.`);
  }

  return lines.join("\n");
}

export function isTestOpportunity(opportunity: Opportunity): boolean {
  const name = opportunity.company_name.toLowerCase();
  const title = opportunity.title.toLowerCase();
  return (
    name.includes("qa test") ||
    name.includes("test review") ||
    name.includes("example company") ||
    title.includes("qa test") ||
    title.includes("sample ")
  );
}

export function buildOutreachDraftForOpportunity(
  opportunity: Opportunity,
  knowledgeSnippets: string[],
  senderName = "Gino",
) {
  return buildOutreachDraft({
    opportunity,
    knowledgeSnippets,
    senderName,
  });
}
