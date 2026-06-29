import { randomUUID } from "crypto";
import type {
  SignalImport,
  SignalImportSource,
  SignalIngestItem,
} from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { buildOpportunityRecord } from "../opportunities/build";
import { normalizeSignalType } from "./ingest-promote";

function parseEstimatedValue(
  raw: string | number | undefined,
): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isNaN(raw) ? null : raw;
  const n = parseFloat(String(raw).replace(/[$,]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function buildSignalImportRecord(
  item: SignalIngestItem,
  importSource: SignalImportSource,
  rawPayload?: Record<string, unknown>,
): SignalImport {
  const preview = buildOpportunityRecord(
    {
      company_name: item.company_name.trim(),
      title: item.opportunity_title.trim(),
      signal_type: normalizeSignalType(item.signal_type),
      source: item.source_name?.trim() || "signal-ingest",
      source_url: item.source_url?.trim() || null,
      signal_summary: item.signal_summary?.trim() || null,
      deadline: item.deadline?.trim() || null,
      estimated_value: parseEstimatedValue(item.estimated_value),
      notes: item.fit_notes?.trim() || null,
    },
    undefined,
    {
      fit_score: item.fit_score,
      recommended_action: item.recommended_action,
    },
  );

  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    company_name: item.company_name.trim(),
    opportunity_title: item.opportunity_title.trim(),
    signal_type: item.signal_type.trim(),
    signal_summary: item.signal_summary?.trim() || null,
    source_name: item.source_name?.trim() || null,
    source_url: item.source_url?.trim() || null,
    deadline: item.deadline?.trim() || null,
    estimated_value: parseEstimatedValue(item.estimated_value),
    location: item.location?.trim() || null,
    fit_score: item.fit_score ?? preview.fit_score,
    fit_notes: item.fit_notes?.trim() || null,
    recommended_action:
      item.recommended_action?.trim() || preview.recommended_action,
    raw_text: item.raw_text?.trim() || null,
    status: "pending",
    matched_opportunity_id: null,
    created_opportunity_id: null,
    created_knowledge_id: null,
    import_source: importSource,
    raw_payload: rawPayload ?? null,
    created_at: now,
    reviewed_at: null,
  };
}
