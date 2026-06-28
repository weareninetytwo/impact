import type {
  Opportunity,
  OpportunityInput,
  SignalIngestItem,
  SignalIngestPayload,
  SignalIngestResult,
  SignalType,
} from "@impact/shared";
import { SIGNAL_TYPES } from "@impact/shared";
import { buildSignalIngestDedupeKey } from "@impact/engines";
import { isSupabasePersistenceEnabled } from "../client";
import { buildOpportunityRecord } from "../opportunities/build";
import { readOpportunities, writeOpportunities } from "../opportunities/store";
import {
  supabaseFindByDedupeKey,
  supabaseUpsertOpportunity,
} from "../opportunities/supabase-store";
import {
  createKnowledgeItem,
  linkKnowledgeToOpportunity,
} from "../knowledge/repository";

function parseEstimatedValue(
  raw: string | number | undefined,
): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isNaN(raw) ? null : raw;
  const n = parseFloat(String(raw).replace(/[$,]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function normalizeSignalType(raw: string): SignalType {
  const lower = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const values = SIGNAL_TYPES.map((s) => s.value);
  if (values.includes(lower as SignalType)) {
    return lower as SignalType;
  }
  const aliases: Record<string, SignalType> = {
    public_bid: "rfp",
    bid: "rfp",
    website: "website_redesign",
    redesign: "website_redesign",
    partner: "agency_partner",
  };
  return aliases[lower] ?? "other";
}

export function validateSignalIngestPayload(
  body: unknown,
): { ok: true; payload: SignalIngestPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const items = (body as SignalIngestPayload).items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "items must be a non-empty array" };
  }
  if (items.length > 100) {
    return { ok: false, error: "Maximum 100 items per request" };
  }
  return { ok: true, payload: { items } };
}

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

function itemToOpportunityInput(item: SignalIngestItem): OpportunityInput {
  const notesParts = [
    item.fit_notes?.trim(),
    item.location?.trim() ? `Location: ${item.location.trim()}` : "",
  ].filter(Boolean);

  return {
    company_name: item.company_name.trim(),
    title: item.opportunity_title.trim(),
    signal_type: normalizeSignalType(item.signal_type),
    source: item.source_name?.trim() || "signal-ingest",
    source_url: item.source_url?.trim() || null,
    signal_summary: item.signal_summary?.trim() || null,
    deadline: item.deadline?.trim() || null,
    estimated_value: parseEstimatedValue(item.estimated_value),
    notes: notesParts.length ? notesParts.join("\n") : null,
  };
}

async function findExistingBySignalKey(
  key: string,
): Promise<Opportunity | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseFindByDedupeKey(key);
  }
  const items = await readOpportunities();
  return (
    items.find(
      (o) =>
        buildSignalIngestDedupeKey(o.company_name, o.source_url, o.title) ===
        key,
    ) ?? null
  );
}

async function saveOpportunity(
  record: Opportunity,
): Promise<Opportunity> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseUpsertOpportunity(record);
  }
  const items = await readOpportunities();
  const index = items.findIndex((o) => o.id === record.id);
  if (index >= 0) items[index] = record;
  else items.push(record);
  await writeOpportunities(items);
  return record;
}

async function attachSourceDocument(
  item: SignalIngestItem,
  opportunityId: string,
): Promise<string | null> {
  const raw = item.raw_text?.trim();
  const url = item.source_url?.trim();
  if (!raw && !url) return null;

  const content = raw
    ? raw
    : `[Source document placeholder]\nURL: ${url}\n\nFull document extraction planned for a future epic.`;

  const knowledge = await createKnowledgeItem({
    title: `${item.company_name.trim()} — ${item.opportunity_title.trim()} (source)`,
    type: normalizeSignalType(item.signal_type) === "rfp" ? "rfp" : "other",
    source: item.source_name?.trim() || "signal-ingest",
    summary: item.signal_summary?.trim() || undefined,
    content_text: content,
    tags: ["signal-ingest", normalizeSignalType(item.signal_type)],
  });

  await linkKnowledgeToOpportunity(opportunityId, knowledge.id);
  return knowledge.id;
}

async function ingestSignalItem(
  item: SignalIngestItem,
  index: number,
): Promise<{
  status: "created" | "updated" | "skipped";
  opportunityId?: string;
  knowledgeId?: string | null;
  error?: string;
}> {
  const validationError = validateSignalIngestItem(item, index);
  if (validationError) {
    return { status: "skipped", error: validationError };
  }

  const input = itemToOpportunityInput(item);
  const dedupeKey = buildSignalIngestDedupeKey(
    input.company_name,
    input.source_url,
    input.title,
  );

  const existing = await findExistingBySignalKey(dedupeKey);
  const record = buildOpportunityRecord(input, existing ?? undefined, {
    fit_score: item.fit_score,
    recommended_action: item.recommended_action,
  });

  // Preserve stage on update unless new
  if (existing) {
    record.stage = existing.stage;
  }

  const saved = await saveOpportunity(record);
  const knowledgeId = await attachSourceDocument(item, saved.id);

  return {
    status: existing ? "updated" : "created",
    opportunityId: saved.id,
    knowledgeId,
  };
}

export async function importSignalItems(
  payload: SignalIngestPayload,
): Promise<SignalIngestResult> {
  const result: SignalIngestResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    opportunity_ids: [],
    knowledge_ids: [],
  };

  for (let i = 0; i < payload.items.length; i++) {
    try {
      const outcome = await ingestSignalItem(payload.items[i], i);
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
    } catch (err) {
      result.skipped++;
      result.errors.push(
        `Item ${i + 1}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
