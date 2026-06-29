import type {
  ScoutRun,
  ScoutSource,
  ScoutSourceInput,
} from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { randomUUID } from "crypto";
import { isSupabasePersistenceEnabled } from "../client";
import { SCOUT_SOURCE_PRESETS } from "./presets";
import { readScoutData, writeScoutData } from "./store";
import {
  supabaseGetScoutSource,
  supabaseInsertScoutRun,
  supabaseInsertScoutSource,
  supabaseListEnabledScoutSources,
  supabaseListScoutRuns,
  supabaseListScoutSources,
  supabaseUpdateScoutRun,
  supabaseUpdateScoutSource,
} from "./supabase-store";

function nowIso(): string {
  return new Date().toISOString();
}

function buildSource(input: ScoutSourceInput): ScoutSource {
  const ts = nowIso();
  return {
    id: randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    name: input.name.trim(),
    source_type: input.source_type,
    url: input.url?.trim() || null,
    query: input.query?.trim() || null,
    enabled: input.enabled ?? true,
    last_run_at: null,
    last_success_at: null,
    last_error: null,
    created_at: ts,
    updated_at: ts,
  };
}

export async function listScoutSources(): Promise<ScoutSource[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListScoutSources();
  }
  const data = await readScoutData();
  return data.sources.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getScoutSource(id: string): Promise<ScoutSource | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseGetScoutSource(id);
  }
  const data = await readScoutData();
  return data.sources.find((s) => s.id === id) ?? null;
}

export async function createScoutSource(
  input: ScoutSourceInput,
): Promise<ScoutSource> {
  const source = buildSource(input);
  if (isSupabasePersistenceEnabled()) {
    return supabaseInsertScoutSource(source);
  }
  const data = await readScoutData();
  data.sources.push(source);
  await writeScoutData(data);
  return source;
}

export async function updateScoutSource(
  id: string,
  patch: Partial<ScoutSourceInput & { enabled: boolean }>,
): Promise<ScoutSource> {
  const existing = await getScoutSource(id);
  if (!existing) throw new Error("Scout source not found");

  const updated: ScoutSource = {
    ...existing,
    name: patch.name?.trim() ?? existing.name,
    source_type: patch.source_type ?? existing.source_type,
    url: patch.url !== undefined ? patch.url?.trim() || null : existing.url,
    query:
      patch.query !== undefined ? patch.query?.trim() || null : existing.query,
    enabled: patch.enabled ?? existing.enabled,
    updated_at: nowIso(),
  };

  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateScoutSource(id, updated);
  }

  const data = await readScoutData();
  data.sources = data.sources.map((s) => (s.id === id ? updated : s));
  await writeScoutData(data);
  return updated;
}

export async function listScoutRuns(limit = 50): Promise<ScoutRun[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListScoutRuns(limit);
  }
  const data = await readScoutData();
  return data.runs
    .sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    )
    .slice(0, limit);
}

export async function listEnabledScoutSources(): Promise<ScoutSource[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListEnabledScoutSources();
  }
  const data = await readScoutData();
  return data.sources.filter((s) => s.enabled);
}

async function insertScoutRun(run: ScoutRun): Promise<ScoutRun> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseInsertScoutRun(run);
  }
  const data = await readScoutData();
  data.runs.push(run);
  await writeScoutData(data);
  return run;
}

async function patchScoutRun(
  id: string,
  patch: Partial<ScoutRun>,
): Promise<ScoutRun> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateScoutRun(id, patch);
  }
  const data = await readScoutData();
  const idx = data.runs.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Scout run not found");
  data.runs[idx] = { ...data.runs[idx], ...patch };
  await writeScoutData(data);
  return data.runs[idx];
}

async function patchScoutSourceTimestamps(
  sourceId: string,
  patch: Partial<
    Pick<ScoutSource, "last_run_at" | "last_success_at" | "last_error">
  >,
): Promise<void> {
  const existing = await getScoutSource(sourceId);
  if (!existing) return;

  const updated: ScoutSource = {
    ...existing,
    ...patch,
    updated_at: nowIso(),
  };

  if (isSupabasePersistenceEnabled()) {
    await supabaseUpdateScoutSource(sourceId, updated);
    return;
  }

  const data = await readScoutData();
  data.sources = data.sources.map((s) =>
    s.id === sourceId ? updated : s,
  );
  await writeScoutData(data);
}

export async function createScoutRunRecord(
  sourceId: string,
): Promise<ScoutRun> {
  const run: ScoutRun = {
    id: randomUUID(),
    source_id: sourceId,
    status: "running",
    found_count: 0,
    queued_count: 0,
    skipped_count: 0,
    error: null,
    started_at: nowIso(),
    finished_at: null,
  };
  return insertScoutRun(run);
}

export async function finishScoutRun(
  runId: string,
  patch: Omit<Partial<ScoutRun>, "id">,
): Promise<ScoutRun> {
  return patchScoutRun(runId, {
    ...patch,
    finished_at: patch.finished_at ?? nowIso(),
  });
}

export async function touchScoutSourceAfterRun(
  sourceId: string,
  outcome: {
    success: boolean;
    error?: string | null;
  },
): Promise<void> {
  const ts = nowIso();
  const patch: Partial<
    Pick<ScoutSource, "last_run_at" | "last_success_at" | "last_error">
  > = {
    last_run_at: ts,
  };

  if (outcome.success) {
    patch.last_success_at = ts;
    patch.last_error = null;
  } else {
    patch.last_error = outcome.error ?? "Scout run failed";
  }

  await patchScoutSourceTimestamps(sourceId, patch);
}

export async function addScoutPresets(): Promise<ScoutSource[]> {
  const existing = await listScoutSources();
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
  const created: ScoutSource[] = [];

  for (const preset of SCOUT_SOURCE_PRESETS) {
    if (existingNames.has(preset.name.toLowerCase())) continue;
    const source = await createScoutSource({
      name: preset.name,
      source_type: preset.source_type,
      url: preset.url,
      query: preset.query,
      enabled: preset.source_type !== "stub",
    });
    created.push(source);
  }

  return created;
}

export { SCOUT_SOURCE_PRESETS };
