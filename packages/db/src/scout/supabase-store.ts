import type { ScoutRun, ScoutSource } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

type SourceRow = {
  id: string;
  tenant_id: string;
  name: string;
  source_type: string;
  url: string | null;
  query: string | null;
  enabled: boolean;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type RunRow = {
  id: string;
  source_id: string;
  status: string;
  found_count: number;
  queued_count: number;
  skipped_count: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

function rowToSource(row: SourceRow): ScoutSource {
  return {
    ...row,
    source_type: row.source_type as ScoutSource["source_type"],
  };
}

function rowToRun(row: RunRow): ScoutRun {
  return {
    ...row,
    status: row.status as ScoutRun["status"],
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseListScoutSources(): Promise<ScoutSource[]> {
  const { data, error } = await getClient()
    .from("scout_sources")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as SourceRow[]).map(rowToSource);
}

export async function supabaseGetScoutSource(
  id: string,
): Promise<ScoutSource | null> {
  const { data, error } = await getClient()
    .from("scout_sources")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToSource(data as SourceRow) : null;
}

export async function supabaseInsertScoutSource(
  source: ScoutSource,
): Promise<ScoutSource> {
  const { data, error } = await getClient()
    .from("scout_sources")
    .insert(source)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToSource(data as SourceRow);
}

export async function supabaseUpdateScoutSource(
  id: string,
  patch: Partial<ScoutSource>,
): Promise<ScoutSource> {
  const { data, error } = await getClient()
    .from("scout_sources")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToSource(data as SourceRow);
}

export async function supabaseListScoutRuns(
  limit = 50,
): Promise<ScoutRun[]> {
  const { data, error } = await getClient()
    .from("scout_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as RunRow[]).map(rowToRun);
}

export async function supabaseListScoutRunsForSource(
  sourceId: string,
  limit = 20,
): Promise<ScoutRun[]> {
  const { data, error } = await getClient()
    .from("scout_runs")
    .select("*")
    .eq("source_id", sourceId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as RunRow[]).map(rowToRun);
}

export async function supabaseInsertScoutRun(
  run: ScoutRun,
): Promise<ScoutRun> {
  const { data, error } = await getClient()
    .from("scout_runs")
    .insert(run)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRun(data as RunRow);
}

export async function supabaseUpdateScoutRun(
  id: string,
  patch: Partial<ScoutRun>,
): Promise<ScoutRun> {
  const { data, error } = await getClient()
    .from("scout_runs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRun(data as RunRow);
}

export async function supabaseListEnabledScoutSources(): Promise<ScoutSource[]> {
  const { data, error } = await getClient()
    .from("scout_sources")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("enabled", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as SourceRow[]).map(rowToSource);
}
