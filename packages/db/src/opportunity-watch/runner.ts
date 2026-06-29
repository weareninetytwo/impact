import type {
  OpportunityWatchRun,
  OpportunityWatchRunResult,
} from "@impact/shared";
import { runAllEnabledScoutSources } from "../scout/runner";
import {
  createOpportunityWatchRunRecord,
  finishOpportunityWatchRun,
} from "./repository";

function resolveWatchStatus(
  sourcesRun: number,
  queued: number,
  errors: string[],
): OpportunityWatchRun["status"] {
  if (sourcesRun === 0) {
    return errors.length > 0 ? "failed" : "success";
  }
  if (errors.length > 0 && queued === 0) return "failed";
  if (errors.length > 0) return "partial";
  return "success";
}

/**
 * Epic 3D MVP: Opportunity Watch runs enabled Scout sources and queues
 * results into signal_imports (review mode). Future: AI search providers.
 */
export async function runOpportunityWatch(): Promise<OpportunityWatchRunResult> {
  const run = await createOpportunityWatchRunRecord();

  try {
    const scoutSummary = await runAllEnabledScoutSources();
    const status = resolveWatchStatus(
      scoutSummary.sources_run,
      scoutSummary.total_queued,
      scoutSummary.errors,
    );

    const finished = await finishOpportunityWatchRun(run.id, {
      status,
      sources_run: scoutSummary.sources_run,
      found_count: scoutSummary.total_found,
      queued_count: scoutSummary.total_queued,
      skipped_count: scoutSummary.total_skipped,
      error:
        scoutSummary.errors.length > 0
          ? scoutSummary.errors.join("; ")
          : null,
    });

    return { run: finished, scout_errors: scoutSummary.errors };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Opportunity Watch failed";
    const finished = await finishOpportunityWatchRun(run.id, {
      status: "failed",
      error: message,
    });
    return { run: finished, scout_errors: [message] };
  }
}

export {
  listOpportunityWatchRuns,
  getLatestOpportunityWatchRun,
} from "./repository";
