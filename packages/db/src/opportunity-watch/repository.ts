import type { OpportunityWatchRun } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { randomUUID } from "crypto";
import { isSupabasePersistenceEnabled } from "../client";
import { readOpportunityWatchRuns, writeOpportunityWatchRuns } from "./store";
import {
  supabaseGetLatestOpportunityWatchRun,
  supabaseInsertOpportunityWatchRun,
  supabaseListOpportunityWatchRuns,
  supabaseUpdateOpportunityWatchRun,
} from "./supabase-store";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listOpportunityWatchRuns(
  limit = 20,
): Promise<OpportunityWatchRun[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListOpportunityWatchRuns(limit);
  }
  const runs = await readOpportunityWatchRuns();
  return runs
    .sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    )
    .slice(0, limit);
}

export async function getLatestOpportunityWatchRun(): Promise<OpportunityWatchRun | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseGetLatestOpportunityWatchRun();
  }
  const runs = await listOpportunityWatchRuns(1);
  return runs[0] ?? null;
}

export async function createOpportunityWatchRunRecord(): Promise<OpportunityWatchRun> {
  const run: OpportunityWatchRun = {
    id: randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    status: "running",
    sources_run: 0,
    found_count: 0,
    queued_count: 0,
    skipped_count: 0,
    error: null,
    started_at: nowIso(),
    finished_at: null,
  };

  if (isSupabasePersistenceEnabled()) {
    return supabaseInsertOpportunityWatchRun(run);
  }

  const runs = await readOpportunityWatchRuns();
  runs.push(run);
  await writeOpportunityWatchRuns(runs);
  return run;
}

export async function finishOpportunityWatchRun(
  id: string,
  patch: Omit<Partial<OpportunityWatchRun>, "id">,
): Promise<OpportunityWatchRun> {
  const finished = {
    ...patch,
    finished_at: patch.finished_at ?? nowIso(),
  };

  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateOpportunityWatchRun(id, finished);
  }

  const runs = await readOpportunityWatchRuns();
  const idx = runs.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Opportunity Watch run not found");
  runs[idx] = { ...runs[idx], ...finished };
  await writeOpportunityWatchRuns(runs);
  return runs[idx];
}
