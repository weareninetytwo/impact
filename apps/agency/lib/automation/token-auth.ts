/**
 * Token auth for automation routes — never require browser login.
 * Used by: /api/signals/import, /api/opportunity-watch/import,
 *          /api/scout/run, /api/opportunity-watch/run
 */

export { verifyIngestAuth, isIngestConfigured } from "@/lib/signals/ingest-auth";
export { verifyScoutAuth, isScoutCronConfigured } from "@/lib/scout/scout-auth";
