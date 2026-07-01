"use server";

import {
  getLinkedKnowledgeForOpportunity,
  getOpportunity,
  listOutreachQueue,
  updateOpportunityNotes,
  updateOpportunityStage,
} from "@impact/db";
import { buildOutreachDraft } from "@impact/engines";
import {
  mergeOutreachIntoNotes,
  parseOutreachFromNotes,
  type StoredOutreachDraft,
} from "@impact/shared";
import type { Opportunity } from "@impact/shared";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/session";

export interface OutreachQueueItem {
  opportunity: Opportunity;
  draft: StoredOutreachDraft;
  hasSavedDraft: boolean;
  knowledgeCount: number;
}

function revalidateOutreachPaths(id?: string) {
  revalidatePath("/outreach");
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/opportunities/${id}`);
}

export async function fetchOutreachQueue(): Promise<OutreachQueueItem[]> {
  const opportunities = await listOutreachQueue();
  const session = await getAuthSession();
  const senderName =
    session?.fullName?.split(/\s+/)[0] ?? "Gino";

  const items: OutreachQueueItem[] = [];

  for (const opportunity of opportunities) {
    const linked = await getLinkedKnowledgeForOpportunity(opportunity.id);
    const snippets = linked
      .slice(0, 2)
      .map((item) => item.summary ?? item.title);

    const { draft: savedDraft } = parseOutreachFromNotes(opportunity.notes);
    const generated = buildOutreachDraft({
      opportunity,
      knowledgeSnippets: snippets,
      senderName,
    });

    const draft: StoredOutreachDraft = savedDraft ?? {
      subject: generated.subject,
      body: generated.body,
      contactEmail: "",
    };

    items.push({
      opportunity,
      draft,
      hasSavedDraft: Boolean(savedDraft),
      knowledgeCount: linked.length,
    });
  }

  return items;
}

export async function saveOutreachDraftAction(
  opportunityId: string,
  draft: StoredOutreachDraft,
): Promise<{ ok: true } | { error: string }> {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) return { error: "Opportunity not found" };

  const { userNotes } = parseOutreachFromNotes(opportunity.notes);
  const notes = mergeOutreachIntoNotes(userNotes, {
    subject: draft.subject.trim(),
    body: draft.body.trim(),
    contactEmail: draft.contactEmail?.trim() ?? "",
  });

  try {
    await updateOpportunityNotes(opportunityId, notes);
    revalidateOutreachPaths(opportunityId);
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save draft",
    };
  }
}

export async function markOutreachReadyAction(
  opportunityId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await updateOpportunityStage(opportunityId, "ready_for_outreach");
    revalidateOutreachPaths(opportunityId);
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update stage",
    };
  }
}

export async function markOutreachSentAction(
  opportunityId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await updateOpportunityStage(opportunityId, "contact_needed");
    revalidateOutreachPaths(opportunityId);
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update stage",
    };
  }
}

export async function prepareAllOutreachAction(): Promise<
  { ok: true; count: number } | { error: string }
> {
  const opportunities = await listOutreachQueue();
  let count = 0;

  for (const opportunity of opportunities) {
    if (opportunity.lead_grade !== "A" && opportunity.lead_grade !== "B") {
      continue;
    }
    if (opportunity.stage === "ready_for_outreach") continue;

    const linked = await getLinkedKnowledgeForOpportunity(opportunity.id);
    const session = await getAuthSession();
    const senderName =
      session?.fullName?.split(/\s+/)[0] ?? "Gino";
    const { draft: savedDraft, userNotes } = parseOutreachFromNotes(
      opportunity.notes,
    );

    if (!savedDraft) {
      const generated = buildOutreachDraft({
        opportunity,
        knowledgeSnippets: linked.slice(0, 2).map((i) => i.summary ?? i.title),
        senderName,
      });
      await updateOpportunityNotes(
        opportunity.id,
        mergeOutreachIntoNotes(userNotes, {
          subject: generated.subject,
          body: generated.body,
          contactEmail: "",
        }),
      );
    }

    await updateOpportunityStage(opportunity.id, "ready_for_outreach");
    count++;
  }

  revalidateOutreachPaths();
  return { ok: true, count };
}

export async function refreshAllOutreachDraftsAction(): Promise<
  { ok: true; count: number } | { error: string }
> {
  try {
    const opportunities = await listOutreachQueue();
    const session = await getAuthSession();
    const senderName =
      session?.fullName?.split(/\s+/)[0] ?? "Gino";
    let count = 0;

    for (const opportunity of opportunities) {
      if (opportunity.lead_grade !== "A" && opportunity.lead_grade !== "B") {
        continue;
      }

      const linked = await getLinkedKnowledgeForOpportunity(opportunity.id);
      const { userNotes } = parseOutreachFromNotes(opportunity.notes);
      const generated = buildOutreachDraft({
        opportunity,
        knowledgeSnippets: linked.slice(0, 2).map((i) => i.summary ?? i.title),
        senderName,
      });

      await updateOpportunityNotes(
        opportunity.id,
        mergeOutreachIntoNotes(userNotes, {
          subject: generated.subject,
          body: generated.body,
          contactEmail: "",
        }),
      );
      count++;
    }

    revalidateOutreachPaths();
    return { ok: true, count };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to refresh drafts",
    };
  }
}
