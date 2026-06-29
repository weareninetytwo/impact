export const SCOUT_SOURCE_TYPES = [
  "rss",
  "html",
  "manual_query",
  "stub",
] as const;

export type ScoutSourceType = (typeof SCOUT_SOURCE_TYPES)[number];

export const SCOUT_RUN_STATUSES = [
  "running",
  "success",
  "partial",
  "failed",
] as const;

export type ScoutRunStatus = (typeof SCOUT_RUN_STATUSES)[number];

export interface ScoutSource {
  id: string;
  tenant_id: string;
  name: string;
  source_type: ScoutSourceType;
  url: string | null;
  query: string | null;
  enabled: boolean;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoutRun {
  id: string;
  source_id: string;
  status: ScoutRunStatus;
  found_count: number;
  queued_count: number;
  skipped_count: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ScoutRunSummary {
  sources_run: number;
  runs: ScoutRun[];
  total_found: number;
  total_queued: number;
  total_skipped: number;
  errors: string[];
}

export interface ScoutSourceInput {
  name: string;
  source_type: ScoutSourceType;
  url?: string | null;
  query?: string | null;
  enabled?: boolean;
}

export interface ScoutPreset {
  preset_key: string;
  name: string;
  source_type: ScoutSourceType;
  url: string | null;
  query: string | null;
  description: string;
}
