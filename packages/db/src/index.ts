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
