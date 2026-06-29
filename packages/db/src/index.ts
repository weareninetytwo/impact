export {
  createBrowserClient,
  createServerClient,
  isSupabaseConfigured,
  isSupabasePersistenceEnabled,
  getPersistenceMode,
} from "./client";
export {
  listOpportunities,
  getOpportunity,
  getDashboardStats,
  createOpportunity,
  importOpportunities,
  updateOpportunityStage,
  updateOpportunityNotes,
} from "./opportunities/repository";
export { listOutreachQueue } from "./opportunities/outreach-queue";
export type { CreateResult, ImportResult } from "./opportunities/repository";
export {
  parseCsvOpportunities,
  parsePasteOpportunities,
} from "./opportunities/import";
export { CSV_TEMPLATE } from "@impact/shared";
export { getDataFilePath } from "./opportunities/store";
export {
  listKnowledgeItems,
  getKnowledgeItem,
  getKnowledgeChunks,
  createKnowledgeItem,
  askKnowledge,
  linkKnowledgeToOpportunity,
  unlinkKnowledgeFromOpportunity,
  getLinkedKnowledgeForOpportunity,
  getOpportunityKnowledgeLinks,
  getKnowledgeItemLinks,
  formatKnowledgeType,
  getKnowledgeDataFilePath,
} from "./knowledge/repository";
export {
  validateSignalIngestPayload,
  validateSignalIngestItem,
  importSignalItems,
} from "./signals/ingest";
export {
  listPendingSignalImports,
  listRecentSignalImports,
  getSignalImport,
  countPendingSignalImports,
  approveSignalImport,
  mergeSignalImport,
  skipSignalImport,
  skipAllPendingSignalImports,
} from "./signals/import-repository";
export {
  listScoutSources,
  getScoutSource,
  createScoutSource,
  updateScoutSource,
  listScoutRuns,
  addScoutPresets,
  SCOUT_SOURCE_PRESETS,
} from "./scout/repository";
export { runScout, runScoutSource, runAllEnabledScoutSources } from "./scout/runner";
export {
  runOpportunityWatch,
  listOpportunityWatchRuns,
  getLatestOpportunityWatchRun,
} from "./opportunity-watch/runner";
export {
  getTenantBySlug,
  getTenantById,
  createTenantRecord,
  getAppUser,
  upsertAppUser,
  listTenantMembers,
  resolveDefaultTenantId,
  slugify,
} from "./auth/repository";
export type { TenantRecord, AppUserRecord } from "./auth/repository";
