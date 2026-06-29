import type {
  DashboardStats,
  ListOpportunitiesOptions,
  Opportunity,
  OpportunityInput,
  OpportunityStage,
} from "@impact/shared";
import { buildSignalIngestDedupeKey } from "@impact/engines";
import { isSupabasePersistenceEnabled } from "../client";
import { buildOpportunityRecord } from "./build";
import {
  readOpportunities,
  writeOpportunities,
} from "./store";
import {
  supabaseFindByDedupeKey,
  supabaseGetOpportunity,
  supabaseListOpportunities,
  supabaseUpdateOpportunity,
  supabaseUpsertOpportunity,
} from "./supabase-store";

export interface CreateResult {
  opportunity: Opportunity;
  duplicate: boolean;
  updated: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function sortByScore(a: Opportunity, b: Opportunity): number {
  return b.total_score - a.total_score;
}

async function listAll(
  options?: ListOpportunitiesOptions,
): Promise<Opportunity[]> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseListOpportunities(options);
  }
  const items = await readOpportunities();
  let filtered = items;
  if (options?.scope === "mine" && options.userId) {
    filtered = items.filter((o) => o.owner_user_id === options.userId);
  }
  if (options?.tenantId) {
    filtered = filtered.filter((o) => o.tenant_id === options.tenantId);
  }
  return filtered.sort(sortByScore);
}

export async function listOpportunities(
  options?: ListOpportunitiesOptions,
): Promise<Opportunity[]> {
  return listAll(options);
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  if (isSupabasePersistenceEnabled()) {
    return supabaseGetOpportunity(id);
  }
  const items = await readOpportunities();
  return items.find((o) => o.id === id) ?? null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const items = await listAll();
  const open = items.filter((o) => !["won", "lost", "skip"].includes(o.stage));

  return {
    total: open.length,
    new_count: open.filter((o) => o.stage === "new").length,
    a_grade: open.filter((o) => o.lead_grade === "A").length,
    ready_for_outreach: open.filter((o) => o.stage === "ready_for_outreach")
      .length,
    needs_contact: open.filter(
      (o) => o.stage === "contact_needed" || o.stage === "reviewed",
    ).length,
    proposals_due: open.filter((o) => o.stage === "proposal").length,
    pipeline_value: open.reduce((sum, o) => sum + (o.estimated_value ?? 0), 0),
  };
}

export async function createOpportunity(
  input: OpportunityInput,
  context?: { tenantId?: string; ownerUserId?: string | null },
): Promise<CreateResult> {
  const key = buildSignalIngestDedupeKey(
    input.company_name,
    input.source_url,
    input.title,
  );

  const buildOpts = {
    tenantId: context?.tenantId,
    ownerUserId: context?.ownerUserId ?? null,
  };

  if (isSupabasePersistenceEnabled()) {
    const existing = await supabaseFindByDedupeKey(key);
    const record = buildOpportunityRecord(input, existing ?? undefined, buildOpts);
    const saved = await supabaseUpsertOpportunity(record);
    return {
      opportunity: saved,
      duplicate: Boolean(existing),
      updated: Boolean(existing),
    };
  }

  const items = await readOpportunities();
  const existingIndex = items.findIndex(
    (o) =>
      buildSignalIngestDedupeKey(o.company_name, o.source_url, o.title) === key,
  );

  if (existingIndex >= 0) {
    const updated = buildOpportunityRecord(
      input,
      items[existingIndex],
      buildOpts,
    );
    items[existingIndex] = updated;
    await writeOpportunities(items);
    return { opportunity: updated, duplicate: true, updated: true };
  }

  const created = buildOpportunityRecord(input, undefined, buildOpts);
  items.push(created);
  await writeOpportunities(items);
  return { opportunity: created, duplicate: false, updated: false };
}

export async function importOpportunities(
  inputs: OpportunityInput[],
): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input.company_name?.trim() || !input.title?.trim()) {
      result.skipped++;
      result.errors.push(`Row ${i + 1}: missing company_name or title`);
      continue;
    }

    try {
      const { duplicate, updated } = await createOpportunity(input);
      if (duplicate && updated) result.updated++;
      else if (!duplicate) result.created++;
      else result.skipped++;
    } catch (err) {
      result.skipped++;
      result.errors.push(
        `Row ${i + 1}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}

export async function updateOpportunityStage(
  id: string,
  stage: OpportunityStage,
): Promise<Opportunity | null> {
  const existing = await getOpportunity(id);
  if (!existing) return null;

  const updated: Opportunity = {
    ...existing,
    stage,
    updated_at: new Date().toISOString(),
  };

  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateOpportunity(updated);
  }

  const items = await readOpportunities();
  const index = items.findIndex((o) => o.id === id);
  if (index < 0) return null;
  items[index] = updated;
  await writeOpportunities(items);
  return updated;
}

export async function updateOpportunityNotes(
  id: string,
  notes: string,
): Promise<Opportunity | null> {
  const existing = await getOpportunity(id);
  if (!existing) return null;

  const rescored = buildOpportunityRecord(
    {
      company_name: existing.company_name,
      company_website: existing.company_website,
      title: existing.title,
      signal_type: existing.signal_type,
      source: existing.source,
      source_url: existing.source_url,
      signal_summary: existing.signal_summary,
      deadline: existing.deadline,
      estimated_value: existing.estimated_value,
      notes,
      stage: existing.stage,
    },
    existing,
  );

  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateOpportunity(rescored);
  }

  const items = await readOpportunities();
  const index = items.findIndex((o) => o.id === id);
  if (index < 0) return null;
  items[index] = rescored;
  await writeOpportunities(items);
  return rescored;
}
