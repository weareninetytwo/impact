export const KNOWLEDGE_TYPES = [
  "proposal",
  "rfp",
  "case_study",
  "sop",
  "rate_sheet",
  "brand_guide",
  "template",
  "faq",
  "capabilities",
  "other",
] as const;

export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

export interface KnowledgeItem {
  id: string;
  tenant_id: string;
  title: string;
  type: KnowledgeType;
  source: string;
  tags: string[];
  summary: string | null;
  content_text: string;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  tenant_id: string;
  knowledge_item_id: string;
  chunk_index: number;
  content: string;
  created_at: string;
}

export interface OpportunityKnowledgeLink {
  id: string;
  tenant_id: string;
  opportunity_id: string;
  knowledge_item_id: string;
  created_at: string;
}

export interface KnowledgeInput {
  title: string;
  type: KnowledgeType;
  source?: string;
  tags?: string[];
  summary?: string;
  content_text: string;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
}

export interface KnowledgeSearchParams {
  query?: string;
  type?: KnowledgeType | "all";
}

export interface RetrievedChunk {
  chunk: KnowledgeChunk;
  item: KnowledgeItem;
  score: number;
}

export interface KnowledgeAnswer {
  question: string;
  answer: string;
  sources: Array<{
    knowledge_item_id: string;
    title: string;
    type: KnowledgeType;
    excerpt: string;
    score: number;
  }>;
  /** Placeholder for future embedding/RAG pipeline */
  retrieval_mode: "keyword" | "embedding";
}
