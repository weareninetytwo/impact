"use server";

import {
  closeQuote,
  createQuote,
  getFollowUpWithQuote,
  getQuoteFollowUpStats,
  getQuoteSenderName,
  listDueFollowUps,
  listQuotes,
  markFollowUpSent,
  skipFollowUp,
  updateFollowUpDraft,
} from "@impact/db";
import type { QuoteInput } from "@impact/shared";
import { revalidatePath } from "next/cache";
import { draftFollowUpWithClaude, isClaudeDraftingConfigured } from "./draft";

type ActionResult = { ok: true } | { error: string };

function revalidateNurturePaths() {
  revalidatePath("/nurture");
  revalidatePath("/dashboard");
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function fetchQuoteFollowUpDashboard() {
  const [due, quotes, stats] = await Promise.all([
    listDueFollowUps(),
    listQuotes(),
    getQuoteFollowUpStats(),
  ]);
  return {
    due,
    quotes,
    stats,
    claudeEnabled: isClaudeDraftingConfigured(),
  };
}

export async function createQuoteAction(input: QuoteInput): Promise<ActionResult> {
  try {
    await createQuote({ ...input, source: "manual" });
    revalidateNurturePaths();
    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Could not save quote") };
  }
}

export async function saveFollowUpDraftAction(
  id: string,
  subject: string,
  body: string,
): Promise<ActionResult> {
  try {
    if (!subject.trim() || !body.trim()) {
      return { error: "Subject and message are required" };
    }
    await updateFollowUpDraft(id, { subject: subject.trim(), body: body.trim() });
    revalidateNurturePaths();
    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Could not save draft") };
  }
}

export async function markFollowUpSentAction(id: string): Promise<ActionResult> {
  try {
    await markFollowUpSent(id);
    revalidateNurturePaths();
    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Could not update follow-up") };
  }
}

export async function skipFollowUpAction(id: string): Promise<ActionResult> {
  try {
    await skipFollowUp(id);
    revalidateNurturePaths();
    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Could not update follow-up") };
  }
}

export async function closeQuoteAction(
  id: string,
  status: "won" | "lost",
): Promise<ActionResult> {
  try {
    await closeQuote(id, status);
    revalidateNurturePaths();
    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Could not close quote") };
  }
}

export async function redraftFollowUpAction(
  id: string,
): Promise<{ ok: true; subject: string; body: string } | { error: string }> {
  if (!isClaudeDraftingConfigured()) {
    return { error: "Set ANTHROPIC_API_KEY to enable Claude drafting" };
  }
  try {
    const followUp = await getFollowUpWithQuote(id);
    if (!followUp) return { error: "Follow-up not found" };

    const draft = await draftFollowUpWithClaude(followUp, getQuoteSenderName());
    if (!draft) {
      return { error: "Claude declined to draft this one — edit the template instead" };
    }

    await updateFollowUpDraft(id, { ...draft, drafted_by: "claude" });
    revalidateNurturePaths();
    return { ok: true, ...draft };
  } catch (err) {
    return { error: errorMessage(err, "Claude drafting failed") };
  }
}
