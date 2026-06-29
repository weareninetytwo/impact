import type {
  SignalImportSource,
  SignalIngestItem,
  SignalIngestMode,
  SignalIngestPayload,
  SignalIngestResult,
} from "@impact/shared";
import {
  SIGNAL_IMPORT_SOURCES,
} from "@impact/shared";
import { createPendingSignalImport } from "./import-repository";
import { promoteSignalIngestItem } from "./ingest-promote";

export function validateSignalIngestItem(
  item: SignalIngestItem,
  index: number,
): string | null {
  if (!item.company_name?.trim()) {
    return `Item ${index + 1}: company_name is required`;
  }
  if (!item.opportunity_title?.trim()) {
    return `Item ${index + 1}: opportunity_title is required`;
  }
  if (!item.signal_type?.trim()) {
    return `Item ${index + 1}: signal_type is required`;
  }
  if (
    item.fit_score != null &&
    (Number.isNaN(item.fit_score) || item.fit_score < 0 || item.fit_score > 100)
  ) {
    return `Item ${index + 1}: fit_score must be 0–100`;
  }
  return null;
}

export function validateSignalIngestPayload(
  body: unknown,
): { ok: true; payload: SignalIngestPayload; mode: SignalIngestMode; importSource: SignalImportSource } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const obj = body as SignalIngestPayload;
  const items = obj.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "items must be a non-empty array" };
  }
  if (items.length > 100) {
    return { ok: false, error: "Maximum 100 items per request" };
  }

  const mode: SignalIngestMode = obj.mode === "direct" ? "direct" : "review";
  const importSource: SignalImportSource =
    obj.import_source &&
    SIGNAL_IMPORT_SOURCES.includes(obj.import_source)
      ? obj.import_source
      : "api";

  return {
    ok: true,
    payload: { items, mode, import_source: importSource },
    mode,
    importSource,
  };
}

async function queueSignalItem(
  item: SignalIngestItem,
  index: number,
  importSource: SignalImportSource,
): Promise<{
  status: "queued" | "skipped";
  signalImportId?: string;
  error?: string;
}> {
  const validationError = validateSignalIngestItem(item, index);
  if (validationError) {
    return { status: "skipped", error: validationError };
  }

  const record = await createPendingSignalImport(item, importSource);
  return { status: "queued", signalImportId: record.id };
}

export async function importSignalItems(
  payload: SignalIngestPayload,
  options?: { mode?: SignalIngestMode; importSource?: SignalImportSource },
): Promise<SignalIngestResult> {
  const mode = options?.mode ?? payload.mode ?? "review";
  const importSource =
    options?.importSource ?? payload.import_source ?? "api";

  const result: SignalIngestResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    queued: 0,
    errors: [],
    opportunity_ids: [],
    knowledge_ids: [],
    signal_import_ids: [],
  };

  for (let i = 0; i < payload.items.length; i++) {
    try {
      if (mode === "direct") {
        const validationError = validateSignalIngestItem(payload.items[i], i);
        if (validationError) {
          result.skipped++;
          result.errors.push(validationError);
          continue;
        }
        const outcome = await promoteSignalIngestItem(payload.items[i]);
        if (outcome.error) {
          result.skipped++;
          result.errors.push(outcome.error);
          continue;
        }
        if (outcome.status === "created") result.created++;
        else if (outcome.status === "updated") result.updated++;
        else result.skipped++;

        if (outcome.opportunityId) {
          result.opportunity_ids.push(outcome.opportunityId);
        }
        if (outcome.knowledgeId) {
          result.knowledge_ids.push(outcome.knowledgeId);
        }
      } else {
        const outcome = await queueSignalItem(
          payload.items[i],
          i,
          importSource,
        );
        if (outcome.error) {
          result.skipped++;
          result.errors.push(outcome.error);
          continue;
        }
        if (outcome.status === "queued") {
          result.queued++;
          if (outcome.signalImportId) {
            result.signal_import_ids.push(outcome.signalImportId);
          }
        } else {
          result.skipped++;
        }
      }
    } catch (err) {
      result.skipped++;
      result.errors.push(
        `Item ${i + 1}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
