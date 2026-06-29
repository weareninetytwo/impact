"use server";

import {
  addScoutPresets,
  createScoutSource,
  listScoutRuns,
  listScoutSources,
  runScout,
  updateScoutSource,
} from "@impact/db";
import type { ScoutRun, ScoutRunSummary, ScoutSourceInput } from "@impact/shared";
import { revalidatePath } from "next/cache";

function revalidateScoutPaths() {
  revalidatePath("/signals/scout");
  revalidatePath("/signals/review");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
}

export async function fetchScoutSources() {
  return listScoutSources();
}

export async function fetchScoutRuns() {
  return listScoutRuns(30);
}

export async function addScoutPresetsAction(): Promise<
  { ok: true; created: number } | { error: string }
> {
  try {
    const created = await addScoutPresets();
    revalidateScoutPaths();
    return { ok: true, created: created.length };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to add presets",
    };
  }
}

export async function createScoutSourceAction(
  input: ScoutSourceInput,
): Promise<{ ok: true } | { error: string }> {
  try {
    if (!input.name?.trim()) return { error: "Name is required" };
    await createScoutSource(input);
    revalidateScoutPaths();
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function toggleScoutSourceAction(
  id: string,
  enabled: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    await updateScoutSource(id, { enabled });
    revalidateScoutPaths();
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function runScoutAction(
  sourceId?: string,
): Promise<
  | { ok: true; result: ScoutRun | ScoutRunSummary }
  | { error: string }
> {
  try {
    const result = await runScout(sourceId);
    revalidateScoutPaths();
    return { ok: true, result };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Scout run failed",
    };
  }
}
