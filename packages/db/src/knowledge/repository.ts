import type {
  KnowledgeAnswer,
  KnowledgeChunk,
  KnowledgeInput,
  KnowledgeItem,
  KnowledgeSearchParams,
  KnowledgeType,
  OpportunityKnowledgeLink,
} from "@impact/shared";
import { isSupabasePersistenceEnabled } from "../client";
import {
  buildChunksForItem,
  buildKnowledgeItem,
  buildOpportunityLink,
} from "./build";
import {
  buildKeywordAnswer,
  filterItems,
  rankChunks,
} from "./retrieve";
import {
  readKnowledgeStore,
  writeKnowledgeStore,
} from "./store";
import {
  supabaseCreateLink,
  supabaseDeleteLink,
  supabaseGetKnowledgeItem,
  supabaseInsertKnowledgeItem,
  supabaseListAllChunks,
  supabaseListChunksForItem,
  supabaseListKnowledgeItems,
  supabaseListLinksForKnowledgeItem,
  supabaseListLinksForOpportunity,
} from "./supabase-store";

async function loadAllLocal(): Promise<{
  items: KnowledgeItem[];
  chunks: KnowledgeChunk[];
  links: OpportunityKnowledgeLink[];
}> {
  return readKnowledgeStore();
}

export async function listKnowledgeItems(
  params: KnowledgeSearchParams = {},
): Promise<KnowledgeItem[]> {
  if (isSupabasePersistenceEnabled()) {
    const items = await supabaseListKnowledgeItems();
    return filterItems(items, params);
  }
  const store = await loadAllLocal();
  return filterItems(store.items, params);
}

export async function getKnowledgeItem(
  id: string,
): Promise<KnowledgeItem | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseGetKnowledgeItem(id);
  }
  const store = await loadAllLocal();
  return store.items.find((i) => i.id === id) ?? null;
}

export async function getKnowledgeChunks(
  knowledgeItemId: string,
): Promise<KnowledgeChunk[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListChunksForItem(knowledgeItemId);
  }
  const store = await loadAllLocal();
  return store.chunks
    .filter((c) => c.knowledge_item_id === knowledgeItemId)
    .sort((a, b) => a.chunk_index - b.chunk_index);
}

export async function createKnowledgeItem(
  input: KnowledgeInput,
): Promise<KnowledgeItem> {
  const item = buildKnowledgeItem(input);
  const chunks = buildChunksForItem(item);
  item.chunk_count = chunks.length;

  if (isSupabasePersistenceEnabled()) {
    return supabaseInsertKnowledgeItem(item, chunks);
  }

  const store = await loadAllLocal();
  store.items.push(item);
  store.chunks.push(...chunks);
  await writeKnowledgeStore(store);
  return item;
}

export async function askKnowledge(question: string): Promise<KnowledgeAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      question: "",
      answer: "Enter a question to search your knowledge base.",
      sources: [],
      retrieval_mode: "keyword",
    };
  }

  let items: KnowledgeItem[];
  let chunks: KnowledgeChunk[];

  if (isSupabasePersistenceEnabled()) {
    items = await supabaseListKnowledgeItems();
    chunks = await supabaseListAllChunks();
  } else {
    const store = await loadAllLocal();
    items = store.items;
    chunks = store.chunks;
  }

  const itemsById = new Map(items.map((i) => [i.id, i]));
  const retrieved = rankChunks(chunks, itemsById, trimmed);
  return buildKeywordAnswer(trimmed, retrieved);
}

export async function getOpportunityKnowledgeLinks(
  opportunityId: string,
): Promise<OpportunityKnowledgeLink[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListLinksForOpportunity(opportunityId);
  }
  const store = await loadAllLocal();
  return store.links.filter((l) => l.opportunity_id === opportunityId);
}

export async function getKnowledgeItemLinks(
  knowledgeItemId: string,
): Promise<OpportunityKnowledgeLink[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListLinksForKnowledgeItem(knowledgeItemId);
  }
  const store = await loadAllLocal();
  return store.links.filter((l) => l.knowledge_item_id === knowledgeItemId);
}

export async function linkKnowledgeToOpportunity(
  opportunityId: string,
  knowledgeItemId: string,
): Promise<OpportunityKnowledgeLink> {
  const link = buildOpportunityLink(opportunityId, knowledgeItemId);

  if (isSupabasePersistenceEnabled()) {
    return supabaseCreateLink(link);
  }

  const store = await loadAllLocal();
  const exists = store.links.some(
    (l) =>
      l.opportunity_id === opportunityId &&
      l.knowledge_item_id === knowledgeItemId,
  );
  if (exists) {
    return store.links.find(
      (l) =>
        l.opportunity_id === opportunityId &&
        l.knowledge_item_id === knowledgeItemId,
    )!;
  }
  store.links.push(link);
  await writeKnowledgeStore(store);
  return link;
}

export async function unlinkKnowledgeFromOpportunity(
  opportunityId: string,
  knowledgeItemId: string,
): Promise<void> {
  if (isSupabasePersistenceEnabled()) {
    await supabaseDeleteLink(opportunityId, knowledgeItemId);
    return;
  }
  const store = await loadAllLocal();
  store.links = store.links.filter(
    (l) =>
      !(
        l.opportunity_id === opportunityId &&
        l.knowledge_item_id === knowledgeItemId
      ),
  );
  await writeKnowledgeStore(store);
}

export async function getLinkedKnowledgeForOpportunity(
  opportunityId: string,
): Promise<KnowledgeItem[]> {
  const links = await getOpportunityKnowledgeLinks(opportunityId);
  const items: KnowledgeItem[] = [];
  for (const link of links) {
    const item = await getKnowledgeItem(link.knowledge_item_id);
    if (item) items.push(item);
  }
  return items;
}

export function formatKnowledgeType(type: KnowledgeType): string {
  return type.replace(/_/g, " ");
}

export { getKnowledgeDataFilePath } from "./store";
