import type { AutomationRunSummary } from "@impact/shared";
import {
  generateCloserBrief,
  generateNurtureEnrollment,
  generateProposal,
  generateQualification,
  generateResearch,
  generateTasksForOpportunity,
  buildExecutiveBriefing,
  buildOutreachDraftForOpportunity,
  isTestOpportunity,
} from "@impact/engines";
import {
  listOpportunities,
  updateOpportunityNotes,
  updateOpportunityStage,
} from "../opportunities/repository";
import { getLinkedKnowledgeForOpportunity } from "../knowledge/repository";
import {
  approveSignalImport,
  listPendingSignalImports,
  skipSignalImport,
} from "../signals/import-repository";
import { runAllEnabledScoutSources } from "../scout/runner";
import { runOpportunityWatch } from "../opportunity-watch/runner";
import {
  mergeOutreachIntoNotes,
  parseOutreachFromNotes,
} from "@impact/shared";
import {
  saveAutomationRun,
  upsertOpportunityArtifact,
  createPipelineArtifact,
  listPipelineArtifacts,
} from "./repository";

function asPayload(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

export interface RunFullPipelineOptions {
  runScout?: boolean;
  runWatch?: boolean;
  autoTriageImports?: boolean;
  senderName?: string;
}

export async function runFullPipeline(
  options: RunFullPipelineOptions = {},
): Promise<AutomationRunSummary> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let scoutSourcesRun = 0;
  let importsApproved = 0;
  let importsSkipped = 0;
  let researchGenerated = 0;
  let qualified = 0;
  let briefsGenerated = 0;
  let nurtureEnrolled = 0;
  let proposalsGenerated = 0;
  let tasksCreated = 0;
  let outreachDraftsPrepared = 0;

  if (options.runScout !== false) {
    try {
      const scout = await runAllEnabledScoutSources();
      scoutSourcesRun = scout.runs?.length ?? 0;
    } catch (err) {
      errors.push(`Scout: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (options.runWatch !== false) {
    try {
      await runOpportunityWatch();
    } catch (err) {
      errors.push(`Watch: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (options.autoTriageImports !== false) {
    try {
      const pending = await listPendingSignalImports();
      for (const record of pending) {
        const isScraper = record.import_source === "scraper";
        const title = record.opportunity_title.toLowerCase();
        const looksLikeRfp =
          record.signal_type === "rfp" ||
          title.includes("rfp") ||
          title.includes("marketing services") ||
          title.includes("website");

        if (!isScraper || looksLikeRfp) {
          try {
            await approveSignalImport(record.id);
            importsApproved++;
          } catch (err) {
            errors.push(
              `Approve ${record.company_name}: ${err instanceof Error ? err.message : "failed"}`,
            );
          }
        } else {
          try {
            await skipSignalImport(record.id);
            importsSkipped++;
          } catch (err) {
            errors.push(
              `Skip ${record.company_name}: ${err instanceof Error ? err.message : "failed"}`,
            );
          }
        }
      }
    } catch (err) {
      errors.push(`Import triage: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  const opportunities = (await listOpportunities()).filter(
    (o) => !["won", "lost", "skip"].includes(o.stage) && !isTestOpportunity(o),
  );

  for (const opportunity of opportunities) {
    try {
      const linked = await getLinkedKnowledgeForOpportunity(opportunity.id);
      const knowledgeSnippets = linked.map(
        (i: { summary?: string | null; title: string }) => i.summary ?? i.title,
      );

      await upsertOpportunityArtifact(
        opportunity.id,
        "company",
        opportunity.company_name,
        "active",
        {
          name: opportunity.company_name,
          website: opportunity.company_website,
          opportunity_count: 1,
        },
      );

      await upsertOpportunityArtifact(
        opportunity.id,
        "contact",
        `Primary — ${opportunity.company_name}`,
        "placeholder",
        { email: "", role: "decision_maker", company: opportunity.company_name },
      );

      const research = generateResearch(opportunity, knowledgeSnippets);
      await upsertOpportunityArtifact(
        opportunity.id,
        "research",
        `Research — ${opportunity.company_name}`,
        "complete",
        asPayload(research),
      );
      researchGenerated++;

      const qualification = generateQualification(opportunity);
      await upsertOpportunityArtifact(
        opportunity.id,
        "qualification",
        `Qualification — ${opportunity.company_name}`,
        qualification.qualified ? "qualified" : "nurture",
        asPayload(qualification),
      );
      if (qualification.qualified) qualified++;

      if (opportunity.lead_grade === "A" || opportunity.lead_grade === "B") {
        const brief = generateCloserBrief(opportunity, research, qualification);
        await upsertOpportunityArtifact(
          opportunity.id,
          "closer_brief",
          `Closer brief — ${opportunity.company_name}`,
          "ready",
          asPayload(brief),
        );
        briefsGenerated++;

        const proposal = generateProposal(opportunity, research, brief);
        await upsertOpportunityArtifact(
          opportunity.id,
          "proposal",
          proposal.title,
          "draft",
          asPayload(proposal),
        );
        proposalsGenerated++;

        const { draft: savedDraft, userNotes } = parseOutreachFromNotes(
          opportunity.notes,
        );
        if (!savedDraft) {
          const generated = buildOutreachDraftForOpportunity(
            opportunity,
            knowledgeSnippets,
            options.senderName,
          );
          await updateOpportunityNotes(
            opportunity.id,
            mergeOutreachIntoNotes(userNotes, {
              subject: generated.subject,
              body: generated.body,
              contactEmail: "",
            }),
          );
          outreachDraftsPrepared++;
        }

        if (
          opportunity.stage === "new" ||
          opportunity.stage === "reviewed"
        ) {
          await updateOpportunityStage(opportunity.id, "ready_for_outreach");
        }
      } else if (opportunity.lead_grade === "C" || opportunity.lead_grade === "D") {
        const nurture = generateNurtureEnrollment(opportunity);
        await upsertOpportunityArtifact(
          opportunity.id,
          "nurture",
          nurture.sequence_name,
          nurture.status,
          asPayload(nurture),
        );
        nurtureEnrolled++;

        if (opportunity.stage === "new") {
          await updateOpportunityStage(opportunity.id, "nurturing");
        }
      }

      const existingTasks = await listPipelineArtifacts("task", opportunity.id);
      if (existingTasks.length === 0) {
        const tasks = generateTasksForOpportunity(opportunity);
        for (const task of tasks) {
          await createPipelineArtifact(
            opportunity.id,
            "task",
            task.title,
            task.status,
            asPayload(task),
          );
          tasksCreated++;
        }
      }
    } catch (err) {
      errors.push(
        `${opportunity.company_name}: ${err instanceof Error ? err.message : "failed"}`,
      );
    }
  }

  const finishedAt = new Date().toISOString();
  const partial: Omit<AutomationRunSummary, "briefing"> = {
    started_at: startedAt,
    finished_at: finishedAt,
    scout_sources_run: scoutSourcesRun,
    imports_approved: importsApproved,
    imports_skipped: importsSkipped,
    opportunities_processed: opportunities.length,
    research_generated: researchGenerated,
    qualified,
    briefs_generated: briefsGenerated,
    nurture_enrolled: nurtureEnrolled,
    proposals_generated: proposalsGenerated,
    tasks_created: tasksCreated,
    outreach_drafts_prepared: outreachDraftsPrepared,
    errors,
  };

  const briefing = buildExecutiveBriefing(opportunities, partial);
  const summary: AutomationRunSummary = { ...partial, briefing };

  await saveAutomationRun(summary as unknown as Record<string, unknown>);

  return summary;
}
