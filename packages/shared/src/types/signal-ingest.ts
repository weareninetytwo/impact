export interface SignalIngestItem {
  company_name: string;
  opportunity_title: string;
  signal_type: string;
  signal_summary?: string;
  source_name?: string;
  source_url?: string;
  deadline?: string;
  estimated_value?: string | number;
  location?: string;
  fit_score?: number;
  fit_notes?: string;
  recommended_action?: string;
  raw_text?: string;
}

import type { SignalImportSource, SignalIngestMode } from "./signal-import";

export interface SignalIngestPayload {
  items: SignalIngestItem[];
  /** Default: review — queues for /signals/review. Use direct for immediate pipeline. */
  mode?: SignalIngestMode;
  import_source?: SignalImportSource;
}

export interface SignalIngestResult {
  created: number;
  updated: number;
  skipped: number;
  queued: number;
  errors: string[];
  opportunity_ids: string[];
  knowledge_ids: string[];
  signal_import_ids: string[];
}

export const SIGNAL_INGEST_SAMPLE: SignalIngestPayload = {
  items: [
    {
      company_name: "Northline Health",
      opportunity_title: "Website redesign RFP",
      signal_type: "rfp",
      signal_summary: "Regional health system seeking brand-aligned website rebuild.",
      source_name: "NYSCR",
      source_url: "https://example.com/rfp/northline-health",
      deadline: "2026-08-15",
      estimated_value: "125000",
      location: "Albany, NY",
      fit_notes: "Healthcare + website — strong ninety two fit",
      raw_text:
        "Northline Health is soliciting proposals for a full website redesign including UX, CMS migration, and accessibility compliance.",
    },
  ],
};
