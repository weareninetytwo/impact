import { randomUUID } from "crypto";
import type {
  KnowledgeChunk,
  KnowledgeInput,
  KnowledgeItem,
  OpportunityKnowledgeLink,
} from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { chunkText } from "./chunking";

export function buildKnowledgeItem(input: KnowledgeInput): KnowledgeItem {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    title: input.title.trim(),
    type: input.type,
    source: input.source?.trim() ?? "",
    tags: input.tags ?? [],
    summary: input.summary?.trim() ?? null,
    content_text: input.content_text.trim(),
    file_name: input.file_name ?? null,
    file_path: input.file_path ?? null,
    mime_type: input.mime_type ?? null,
    chunk_count: 0,
    created_at: now,
    updated_at: now,
  };
}

export function buildChunksForItem(item: KnowledgeItem): KnowledgeChunk[] {
  const parts = chunkText(item.content_text);
  const now = new Date().toISOString();
  return parts.map((content, chunk_index) => ({
    id: randomUUID(),
    tenant_id: item.tenant_id,
    knowledge_item_id: item.id,
    chunk_index,
    content,
    created_at: now,
  }));
}

export function buildOpportunityLink(
  opportunityId: string,
  knowledgeItemId: string,
): OpportunityKnowledgeLink {
  return {
    id: randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    opportunity_id: opportunityId,
    knowledge_item_id: knowledgeItemId,
    created_at: new Date().toISOString(),
  };
}
