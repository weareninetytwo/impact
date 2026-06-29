import type {
  Opportunity,
  OpportunityInput,
  SignalIngestItem,
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

export function normalizeSignalType(raw: string): SignalType {
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

export function itemToOpportunityInput(item: SignalIngestItem): OpportunityInput {
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

export async function attachSourceDocumentForItem(
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

export async function promoteSignalIngestItem(
  item: SignalIngestItem,
): Promise<{
  status: "created" | "updated" | "skipped";
  opportunityId?: string;
  knowledgeId?: string | null;
  error?: string;
}> {
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

  if (existing) {
    record.stage = existing.stage;
  }

  const saved = await saveOpportunity(record);
  const knowledgeId = await attachSourceDocumentForItem(item, saved.id);

  return {
    status: existing ? "updated" : "created",
    opportunityId: saved.id,
    knowledgeId,
  };
}
