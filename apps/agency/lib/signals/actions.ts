"use server";

import {
  importSignalItems,
  validateSignalIngestPayload,
  listPendingSignalImports,
  countPendingSignalImports,
  approveSignalImport,
  mergeSignalImport,
  skipSignalImport,
} from "@impact/db";
import type { SignalIngestPayload, SignalIngestResult } from "@impact/shared";
import { revalidatePath } from "next/cache";

function revalidateSignalPaths() {
  revalidatePath("/opportunities");
  revalidatePath("/signals");
  revalidatePath("/signals/review");
  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
}

export async function fetchPendingSignalImports() {
  return listPendingSignalImports();
}

export async function fetchPendingImportCount() {
  return countPendingSignalImports();
}

export async function importSignalsAction(
  jsonText: string,
  mode: "review" | "direct" = "direct",
): Promise<SignalIngestResult | { error: string }> {
  let body: unknown;
  try {
    body = JSON.parse(jsonText);
  } catch {
    return { error: "Invalid JSON" };
  }

  if (body && typeof body === "object" && !("mode" in body)) {
    (body as SignalIngestPayload).mode = mode;
  }

  const validated = validateSignalIngestPayload(body);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const result = await importSignalItems(validated.payload, {
    mode: validated.mode,
    importSource: validated.importSource,
  });
  revalidateSignalPaths();
  return result;
}

export async function approveSignalImportAction(
  importId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await approveSignalImport(importId);
    revalidateSignalPaths();
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Approve failed",
    };
  }
}

export async function mergeSignalImportAction(
  importId: string,
  opportunityId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await mergeSignalImport(importId, opportunityId);
    revalidateSignalPaths();
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Merge failed",
    };
  }
}

export async function skipSignalImportAction(
  importId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await skipSignalImport(importId);
    revalidateSignalPaths();
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Skip failed",
    };
  }
}
