import type { SignalIngestItem } from "./signal-ingest";

export const SIGNAL_IMPORT_STATUSES = [
  "pending",
  "approved",
  "merged",
  "skipped",
] as const;

export type SignalImportStatus = (typeof SIGNAL_IMPORT_STATUSES)[number];

export const SIGNAL_IMPORT_SOURCES = [
  "gpt",
  "api",
  "manual",
  "scraper",
] as const;

export type SignalImportSource = (typeof SIGNAL_IMPORT_SOURCES)[number];

export type SignalIngestMode = "review" | "direct";

export interface SignalImport {
  id: string;
  tenant_id: string;
  company_name: string;
  opportunity_title: string;
  signal_type: string;
  signal_summary: string | null;
  source_name: string | null;
  source_url: string | null;
  deadline: string | null;
  estimated_value: number | null;
  location: string | null;
  fit_score: number | null;
  fit_notes: string | null;
  recommended_action: string | null;
  raw_text: string | null;
  status: SignalImportStatus;
  matched_opportunity_id: string | null;
  created_opportunity_id: string | null;
  created_knowledge_id: string | null;
  import_source: SignalImportSource;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  reviewed_at: string | null;
}

export function signalImportToIngestItem(record: SignalImport): SignalIngestItem {
  return {
    company_name: record.company_name,
    opportunity_title: record.opportunity_title,
    signal_type: record.signal_type,
    signal_summary: record.signal_summary ?? undefined,
    source_name: record.source_name ?? undefined,
    source_url: record.source_url ?? undefined,
    deadline: record.deadline ?? undefined,
    estimated_value: record.estimated_value ?? undefined,
    location: record.location ?? undefined,
    fit_score: record.fit_score ?? undefined,
    fit_notes: record.fit_notes ?? undefined,
    recommended_action: record.recommended_action ?? undefined,
    raw_text: record.raw_text ?? undefined,
  };
}
