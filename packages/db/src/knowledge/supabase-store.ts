import type {
  KnowledgeChunk,
  KnowledgeItem,
  OpportunityKnowledgeLink,
} from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

type ItemRow = {
  id: string;
  tenant_id: string;
  title: string;
  type: string;
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
};

type ChunkRow = {
  id: string;
  tenant_id: string;
  knowledge_item_id: string;
  chunk_index: number;
  content: string;
  created_at: string;
};

type LinkRow = {
  id: string;
  tenant_id: string;
  opportunity_id: string;
  knowledge_item_id: string;
  created_at: string;
};

function rowToItem(row: ItemRow): KnowledgeItem {
  return {
    ...row,
    type: row.type as KnowledgeItem["type"],
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseListKnowledgeItems(): Promise<KnowledgeItem[]> {
  const { data, error } = await getClient()
    .from("knowledge_items")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .neq("source", "impact-pipeline")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ItemRow[]).map(rowToItem);
}

export async function supabaseGetKnowledgeItem(
  id: string,
): Promise<KnowledgeItem | null> {
  const { data, error } = await getClient()
    .from("knowledge_items")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToItem(data as ItemRow) : null;
}

export async function supabaseInsertKnowledgeItem(
  item: KnowledgeItem,
  chunks: KnowledgeChunk[],
): Promise<KnowledgeItem> {
  const client = getClient();
  const itemRow = { ...item, chunk_count: chunks.length };

  const { error: itemError } = await client.from("knowledge_items").insert(itemRow);
  if (itemError) throw new Error(itemError.message);

  if (chunks.length > 0) {
    const { error: chunkError } = await client.from("knowledge_chunks").insert(chunks);
    if (chunkError) throw new Error(chunkError.message);
  }

  return item;
}

export async function supabaseListAllChunks(): Promise<KnowledgeChunk[]> {
  const { data, error } = await getClient()
    .from("knowledge_chunks")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID);

  if (error) throw new Error(error.message);
  return data as KnowledgeChunk[];
}

export async function supabaseListChunksForItem(
  knowledgeItemId: string,
): Promise<KnowledgeChunk[]> {
  const { data, error } = await getClient()
    .from("knowledge_chunks")
    .select("*")
    .eq("knowledge_item_id", knowledgeItemId)
    .order("chunk_index", { ascending: true });

  if (error) throw new Error(error.message);
  return data as KnowledgeChunk[];
}

export async function supabaseListLinksForOpportunity(
  opportunityId: string,
): Promise<OpportunityKnowledgeLink[]> {
  const { data, error } = await getClient()
    .from("opportunity_knowledge_links")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .eq("tenant_id", DEFAULT_TENANT_ID);

  if (error) throw new Error(error.message);
  return data as LinkRow[];
}

export async function supabaseListLinksForKnowledgeItem(
  knowledgeItemId: string,
): Promise<OpportunityKnowledgeLink[]> {
  const { data, error } = await getClient()
    .from("opportunity_knowledge_links")
    .select("*")
    .eq("knowledge_item_id", knowledgeItemId)
    .eq("tenant_id", DEFAULT_TENANT_ID);

  if (error) throw new Error(error.message);
  return data as LinkRow[];
}

export async function supabaseCreateLink(
  link: OpportunityKnowledgeLink,
): Promise<OpportunityKnowledgeLink> {
  const { data, error } = await getClient()
    .from("opportunity_knowledge_links")
    .insert(link)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as LinkRow;
}

export async function supabaseDeleteLink(
  opportunityId: string,
  knowledgeItemId: string,
): Promise<void> {
  const { error } = await getClient()
    .from("opportunity_knowledge_links")
    .delete()
    .eq("opportunity_id", opportunityId)
    .eq("knowledge_item_id", knowledgeItemId)
    .eq("tenant_id", DEFAULT_TENANT_ID);

  if (error) throw new Error(error.message);
}
