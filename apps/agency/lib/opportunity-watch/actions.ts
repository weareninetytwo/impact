"use server";

import {
  getLatestOpportunityWatchRun,
  listOpportunityWatchRuns,
  listScoutSources,
  runOpportunityWatch,
  listPendingSignalImports,
  listRecentSignalImports,
} from "@impact/db";
import { revalidatePath } from "next/cache";

function revalidateWatchPaths() {
  revalidatePath("/signals/opportunity-watch");
  revalidatePath("/signals/review");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
}

export async function fetchLatestOpportunityWatchRun() {
  return getLatestOpportunityWatchRun();
}

export async function fetchOpportunityWatchDashboard() {
  const [latestRun, runs, sources, pending, recent] = await Promise.all([
    getLatestOpportunityWatchRun(),
    listOpportunityWatchRuns(10),
    listScoutSources(),
    listPendingSignalImports(),
    listRecentSignalImports(12),
  ]);

  return { latestRun, runs, sources, pending, recent };
}

export async function runOpportunityWatchAction(): Promise<
  | { ok: true; queued: number; found: number; skipped: number }
  | { error: string }
> {
  try {
    const result = await runOpportunityWatch();
    revalidateWatchPaths();
    return {
      ok: true,
      queued: result.run.queued_count,
      found: result.run.found_count,
      skipped: result.run.skipped_count,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Run failed",
    };
  }
}
