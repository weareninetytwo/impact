"use server";

import { revalidatePath } from "next/cache";
import {
  createOpportunity,
  importOpportunities,
  listOpportunities,
  getOpportunity,
  getDashboardStats,
  updateOpportunityStage,
  updateOpportunityNotes,
  parseCsvOpportunities,
  parsePasteOpportunities,
} from "@impact/db";
import type { OpportunityInput, OpportunityStage, LeadScope } from "@impact/shared";
import { getRequestContext } from "@/lib/auth/context";

export async function fetchOpportunities(scope: LeadScope = "team") {
  const ctx = await getRequestContext();
  return listOpportunities({
    tenantId: ctx.tenantId,
    scope,
    userId: ctx.userId,
  });
}

export async function fetchOpportunity(id: string) {
  return getOpportunity(id);
}

export async function fetchDashboardStats() {
  const ctx = await getRequestContext();
  return getDashboardStats({ tenantId: ctx.tenantId });
}

export async function createOpportunityAction(input: OpportunityInput) {
  if (!input.company_name?.trim()) {
    return { error: "Company name is required" };
  }
  if (!input.title?.trim()) {
    return { error: "Title is required" };
  }
  if (!input.source?.trim()) {
    return { error: "Source is required" };
  }

  const ctx = await getRequestContext();
  const result = await createOpportunity(input, {
    tenantId: ctx.tenantId,
    ownerUserId: ctx.userId,
  });
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  return { success: true, ...result };
}

export async function importCsvAction(csv: string) {
  const inputs = parseCsvOpportunities(csv);
  if (inputs.length === 0) {
    return { error: "No valid rows found in CSV" };
  }
  const result = await importOpportunities(inputs);
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  return { success: true, ...result };
}

export async function importPasteAction(text: string) {
  const inputs = parsePasteOpportunities(text);
  if (inputs.length === 0) {
    return { error: "No valid opportunities parsed from text" };
  }
  const result = await importOpportunities(inputs);
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  return { success: true, ...result };
}

export async function updateStageAction(id: string, stage: OpportunityStage) {
  const updated = await updateOpportunityStage(id, stage);
  if (!updated) return { error: "Opportunity not found" };
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  return { success: true, opportunity: updated };
}

export async function updateNotesAction(id: string, notes: string) {
  const updated = await updateOpportunityNotes(id, notes);
  if (!updated) return { error: "Opportunity not found" };
  revalidatePath(`/opportunities/${id}`);
  return { success: true, opportunity: updated };
}
