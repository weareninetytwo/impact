export const OPPORTUNITY_WATCH_RUN_STATUSES = [
  "running",
  "success",
  "partial",
  "failed",
] as const;

export type OpportunityWatchRunStatus =
  (typeof OPPORTUNITY_WATCH_RUN_STATUSES)[number];

export interface OpportunityWatchRun {
  id: string;
  tenant_id: string;
  status: OpportunityWatchRunStatus;
  sources_run: number;
  found_count: number;
  queued_count: number;
  skipped_count: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface OpportunityWatchRunResult {
  run: OpportunityWatchRun;
  scout_errors: string[];
}
