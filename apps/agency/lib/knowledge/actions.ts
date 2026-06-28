"use server";

import { revalidatePath } from "next/cache";
import {
  listKnowledgeItems,
  getKnowledgeItem,
  getKnowledgeChunks,
  createKnowledgeItem,
  askKnowledge,
  linkKnowledgeToOpportunity,
  unlinkKnowledgeFromOpportunity,
  getLinkedKnowledgeForOpportunity,
  listOpportunities,
} from "@impact/db";
import type { KnowledgeInput, KnowledgeType } from "@impact/shared";
import { KNOWLEDGE_TYPES } from "@impact/shared";

export async function fetchKnowledgeItems(params?: {
  query?: string;
  type?: string;
}) {
  return listKnowledgeItems({
    query: params?.query,
    type:
      params?.type && params.type !== "all"
        ? (params.type as KnowledgeType)
        : "all",
  });
}

export async function fetchKnowledgeItem(id: string) {
  return getKnowledgeItem(id);
}

export async function fetchKnowledgeChunks(knowledgeItemId: string) {
  return getKnowledgeChunks(knowledgeItemId);
}

export async function fetchKnowledgeAnswer(question: string) {
  return askKnowledge(question);
}

export async function fetchLinkedKnowledge(opportunityId: string) {
  return getLinkedKnowledgeForOpportunity(opportunityId);
}

export async function fetchAllOpportunitiesForLinking() {
  return listOpportunities();
}

export async function createKnowledgeItemAction(input: KnowledgeInput) {
  if (!input.title?.trim()) {
    return { error: "Title is required" };
  }
  if (!input.content_text?.trim() && !input.file_name) {
    return { error: "Content or file is required" };
  }
  if (!KNOWLEDGE_TYPES.includes(input.type)) {
    return { error: "Invalid knowledge type" };
  }

  const item = await createKnowledgeItem({
    ...input,
    tags: input.tags?.filter(Boolean) ?? [],
  });

  revalidatePath("/knowledge");
  return { item };
}

export async function createKnowledgeFromFormAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "other") as KnowledgeType;
  const source = String(formData.get("source") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content_text = String(formData.get("content_text") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  let file_name: string | null = null;
  let mime_type: string | null = null;
  let file_path: string | null = null;
  let finalContent = content_text;

  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    file_name = file.name;
    mime_type = file.type || null;
    file_path = `knowledge/{tenant_id}/{item_id}/${file.name}`;

    const lower = file.name.toLowerCase();
    if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      finalContent = await file.text();
    } else if (lower.endsWith(".pdf") || lower.endsWith(".docx")) {
      if (!finalContent) {
        finalContent = `[File uploaded: ${file.name}]\n\nFull PDF/DOCX text extraction is planned for a future epic. Paste the document text above or add a summary until then.`;
      }
    } else {
      if (!finalContent) {
        finalContent = `[File: ${file.name}] — paste content in the text field for indexing.`;
      }
    }
  }

  if (!finalContent.trim() && !file_name) {
    return { error: "Content or file is required" };
  }

  return createKnowledgeItemAction({
    title,
    type,
    source,
    summary: summary || undefined,
    content_text: finalContent.trim() || `[File uploaded: ${file_name}]`,
    tags,
    file_name,
    file_path,
    mime_type,
  });
}

export async function askKnowledgeAction(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  return askKnowledge(question);
}

export async function linkKnowledgeAction(
  opportunityId: string,
  knowledgeItemId: string,
) {
  await linkKnowledgeToOpportunity(opportunityId, knowledgeItemId);
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/knowledge/${knowledgeItemId}`);
  return { ok: true };
}

export async function unlinkKnowledgeAction(
  opportunityId: string,
  knowledgeItemId: string,
) {
  await unlinkKnowledgeFromOpportunity(opportunityId, knowledgeItemId);
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/knowledge/${knowledgeItemId}`);
  return { ok: true };
}
