import type { Opportunity, OpportunityStage } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { buildDedupeKey } from "@impact/engines";
import { createServerClient } from "../client";

type DbRow = {
  id: string;
  tenant_id: string;
  company_name: string;
  company_website: string | null;
  title: string;
  stage: string;
  lead_grade: string;
  signal_type: string;
  source: string;
  source_url: string | null;
  signal_summary: string | null;
  deadline: string | null;
  estimated_value: number | null;
  fit_score: number;
  urgency_score: number;
  value_score: number;
  confidence_score: number;
  total_score: number;
  next_action: string;
  recommended_action: string;
  notes: string | null;
  dedupe_key: string;
  created_at: string;
  updated_at: string;
};

function rowToOpportunity(row: DbRow): Opportunity {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    company_name: row.company_name,
    company_website: row.company_website,
    title: row.title,
    stage: row.stage as OpportunityStage,
    lead_grade: row.lead_grade as Opportunity["lead_grade"],
    signal_type: row.signal_type as Opportunity["signal_type"],
    source: row.source,
    source_url: row.source_url,
    signal_summary: row.signal_summary,
    deadline: row.deadline,
    estimated_value: row.estimated_value,
    fit_score: Number(row.fit_score),
    urgency_score: Number(row.urgency_score),
    value_score: Number(row.value_score),
    confidence_score: Number(row.confidence_score),
    total_score: Number(row.total_score),
    next_action: row.next_action,
    recommended_action: row.recommended_action,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function opportunityToRow(opp: Opportunity): Omit<DbRow, "dedupe_key"> & {
  dedupe_key: string;
} {
  return {
    id: opp.id,
    tenant_id: opp.tenant_id,
    company_name: opp.company_name,
    company_website: opp.company_website,
    title: opp.title,
    stage: opp.stage,
    lead_grade: opp.lead_grade,
    signal_type: opp.signal_type,
    source: opp.source,
    source_url: opp.source_url,
    signal_summary: opp.signal_summary,
    deadline: opp.deadline,
    estimated_value: opp.estimated_value,
    fit_score: opp.fit_score,
    urgency_score: opp.urgency_score,
    value_score: opp.value_score,
    confidence_score: opp.confidence_score,
    total_score: opp.total_score,
    next_action: opp.next_action,
    recommended_action: opp.recommended_action,
    notes: opp.notes,
    dedupe_key: buildDedupeKey(
      opp.company_name,
      opp.company_website,
      opp.source_url,
    ),
    created_at: opp.created_at,
    updated_at: opp.updated_at,
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) {
    throw new Error("Supabase server client not configured");
  }
  return client;
}

export async function supabaseListOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await getClient()
    .from("opportunity_records")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("total_score", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(rowToOpportunity);
}

export async function supabaseGetOpportunity(
  id: string,
): Promise<Opportunity | null> {
  const { data, error } = await getClient()
    .from("opportunity_records")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToOpportunity(data as DbRow) : null;
}

export async function supabaseFindByDedupeKey(
  dedupeKey: string,
): Promise<Opportunity | null> {
  const { data, error } = await getClient()
    .from("opportunity_records")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToOpportunity(data as DbRow) : null;
}

export async function supabaseUpsertOpportunity(
  opp: Opportunity,
): Promise<Opportunity> {
  const row = opportunityToRow(opp);
  const { data, error } = await getClient()
    .from("opportunity_records")
    .upsert(row, { onConflict: "tenant_id,dedupe_key" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToOpportunity(data as DbRow);
}

export async function supabaseUpdateOpportunity(
  opp: Opportunity,
): Promise<Opportunity> {
  const row = opportunityToRow(opp);
  const { data, error } = await getClient()
    .from("opportunity_records")
    .update(row)
    .eq("id", opp.id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToOpportunity(data as DbRow);
}
