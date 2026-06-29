import type { OpportunityWatchRun } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

type Row = {
  id: string;
  tenant_id: string;
  status: string;
  sources_run: number;
  found_count: number;
  queued_count: number;
  skipped_count: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

function rowToRun(row: Row): OpportunityWatchRun {
  return {
    ...row,
    status: row.status as OpportunityWatchRun["status"],
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseInsertOpportunityWatchRun(
  run: OpportunityWatchRun,
): Promise<OpportunityWatchRun> {
  const { data, error } = await getClient()
    .from("opportunity_watch_runs")
    .insert(run)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRun(data as Row);
}

export async function supabaseUpdateOpportunityWatchRun(
  id: string,
  patch: Partial<OpportunityWatchRun>,
): Promise<OpportunityWatchRun> {
  const { data, error } = await getClient()
    .from("opportunity_watch_runs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRun(data as Row);
}

export async function supabaseListOpportunityWatchRuns(
  limit = 20,
): Promise<OpportunityWatchRun[]> {
  const { data, error } = await getClient()
    .from("opportunity_watch_runs")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToRun);
}

export async function supabaseGetLatestOpportunityWatchRun(): Promise<OpportunityWatchRun | null> {
  const runs = await supabaseListOpportunityWatchRuns(1);
  return runs[0] ?? null;
}
