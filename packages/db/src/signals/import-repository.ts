import type {
  SignalImport,
  SignalImportSource,
  SignalIngestItem,
} from "@impact/shared";
import { signalImportToIngestItem } from "@impact/shared";
import { isSupabasePersistenceEnabled } from "../client";
import { buildSignalImportRecord } from "./import-build";
import {
  readSignalImports,
  writeSignalImports,
} from "./import-store";
import {
  supabaseCountPendingSignalImports,
  supabaseGetSignalImport,
  supabaseInsertSignalImport,
  supabaseListSignalImports,
  supabaseUpdateSignalImport,
} from "./import-supabase";
import {
  attachSourceDocumentForItem,
  promoteSignalIngestItem,
} from "./ingest-promote";

async function listAll(
  status?: SignalImport["status"],
): Promise<SignalImport[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListSignalImports(status);
  }
  const records = await readSignalImports();
  const filtered = status
    ? records.filter((r) => r.status === status)
    : records;
  return filtered.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function listPendingSignalImports(): Promise<SignalImport[]> {
  return listAll("pending");
}

export async function listRecentSignalImports(
  limit = 15,
): Promise<SignalImport[]> {
  const all = await listAll();
  return all.slice(0, limit);
}

export async function getSignalImport(
  id: string,
): Promise<SignalImport | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseGetSignalImport(id);
  }
  const records = await readSignalImports();
  return records.find((r) => r.id === id) ?? null;
}

export async function countPendingSignalImports(options?: {
  tenantId?: string;
}): Promise<number> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseCountPendingSignalImports(options?.tenantId);
  }
  const records = await readSignalImports();
  const pending = records.filter((r) => r.status === "pending");
  if (!options?.tenantId) return pending.length;
  return pending.filter((r) => r.tenant_id === options.tenantId).length;
}

export async function createPendingSignalImport(
  item: SignalIngestItem,
  importSource: SignalImportSource,
): Promise<SignalImport> {
  const record = buildSignalImportRecord(item, importSource, {
    ...item,
  });

  if (isSupabasePersistenceEnabled()) {
    return supabaseInsertSignalImport(record);
  }

  const records = await readSignalImports();
  records.push(record);
  await writeSignalImports(records);
  return record;
}

async function saveSignalImport(record: SignalImport): Promise<SignalImport> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateSignalImport(record);
  }
  const records = await readSignalImports();
  const index = records.findIndex((r) => r.id === record.id);
  if (index >= 0) records[index] = record;
  else records.push(record);
  await writeSignalImports(records);
  return record;
}

export async function approveSignalImport(
  id: string,
): Promise<{ opportunityId: string; knowledgeId: string | null }> {
  const record = await getSignalImport(id);
  if (!record) throw new Error("Import not found");
  if (record.status !== "pending") {
    throw new Error("Import is not pending");
  }

  const item = signalImportToIngestItem(record);
  const outcome = await promoteSignalIngestItem(item);
  if (outcome.error || !outcome.opportunityId) {
    throw new Error(outcome.error ?? "Failed to promote import");
  }

  await saveSignalImport({
    ...record,
    status: "approved",
    created_opportunity_id: outcome.opportunityId,
    created_knowledge_id: outcome.knowledgeId ?? null,
    reviewed_at: new Date().toISOString(),
  });

  return {
    opportunityId: outcome.opportunityId,
    knowledgeId: outcome.knowledgeId ?? null,
  };
}

export async function mergeSignalImport(
  id: string,
  opportunityId: string,
): Promise<{ knowledgeId: string | null }> {
  const record = await getSignalImport(id);
  if (!record) throw new Error("Import not found");
  if (record.status !== "pending") {
    throw new Error("Import is not pending");
  }

  const item = signalImportToIngestItem(record);
  const knowledgeId = await attachSourceDocumentForItem(item, opportunityId);

  await saveSignalImport({
    ...record,
    status: "merged",
    matched_opportunity_id: opportunityId,
    created_knowledge_id: knowledgeId,
    reviewed_at: new Date().toISOString(),
  });

  return { knowledgeId };
}

export async function skipSignalImport(id: string): Promise<void> {
  const record = await getSignalImport(id);
  if (!record) throw new Error("Import not found");
  if (record.status !== "pending") {
    throw new Error("Import is not pending");
  }

  await saveSignalImport({
    ...record,
    status: "skipped",
    reviewed_at: new Date().toISOString(),
  });
}
