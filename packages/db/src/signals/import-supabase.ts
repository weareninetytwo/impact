import type { SignalImport } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

type Row = {
  id: string;
  tenant_id: string;
  company_name: string;
  opportunity_title: string;
  signal_type: string;
  signal_summary: string | null;
  source_name: string | null;
  source_url: string | null;
  deadline: string | null;
  estimated_value: number | null;
  location: string | null;
  fit_score: number | null;
  fit_notes: string | null;
  recommended_action: string | null;
  raw_text: string | null;
  status: string;
  matched_opportunity_id: string | null;
  created_opportunity_id: string | null;
  created_knowledge_id: string | null;
  import_source: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  reviewed_at: string | null;
};

function rowToRecord(row: Row): SignalImport {
  return {
    ...row,
    status: row.status as SignalImport["status"],
    import_source: row.import_source as SignalImport["import_source"],
    estimated_value:
      row.estimated_value != null ? Number(row.estimated_value) : null,
    fit_score: row.fit_score != null ? Number(row.fit_score) : null,
  };
}

function recordToRow(record: SignalImport): Row {
  return record as Row;
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseListSignalImports(
  status?: SignalImport["status"],
): Promise<SignalImport[]> {
  let query = getClient()
    .from("signal_imports")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToRecord);
}

export async function supabaseGetSignalImport(
  id: string,
): Promise<SignalImport | null> {
  const { data, error } = await getClient()
    .from("signal_imports")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as Row) : null;
}

export async function supabaseInsertSignalImport(
  record: SignalImport,
): Promise<SignalImport> {
  const { data, error } = await getClient()
    .from("signal_imports")
    .insert(recordToRow(record))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRecord(data as Row);
}

export async function supabaseUpdateSignalImport(
  record: SignalImport,
): Promise<SignalImport> {
  const { data, error } = await getClient()
    .from("signal_imports")
    .update(recordToRow(record))
    .eq("id", record.id)
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRecord(data as Row);
}

export async function supabaseCountPendingSignalImports(): Promise<number> {
  const { count, error } = await getClient()
    .from("signal_imports")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return count ?? 0;
}
