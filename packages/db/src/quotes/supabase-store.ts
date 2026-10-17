import type {
  Quote,
  QuoteFollowUp,
  QuoteStatus,
  FollowUpStatus,
} from "@impact/shared";
import { getTenantId } from "@impact/shared";
import { createServerClient } from "../client";

type QuoteRow = Omit<Quote, "amount"> & { amount: number | string | null };

function rowToQuote(row: QuoteRow): Quote {
  return {
    ...row,
    // Postgres NUMERIC comes back as a string
    amount: row.amount == null ? null : Number(row.amount),
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseListQuotes(): Promise<Quote[]> {
  const { data, error } = await getClient()
    .from("quotes")
    .select("*")
    .eq("tenant_id", getTenantId())
    .order("quote_sent_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as QuoteRow[]).map(rowToQuote);
}

export async function supabaseGetQuote(id: string): Promise<Quote | null> {
  const { data, error } = await getClient()
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToQuote(data as QuoteRow) : null;
}

export async function supabaseFindQuoteByExternalRef(
  externalRef: string,
): Promise<Quote | null> {
  const { data, error } = await getClient()
    .from("quotes")
    .select("*")
    .eq("tenant_id", getTenantId())
    .eq("external_ref", externalRef)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToQuote(data as QuoteRow) : null;
}

export async function supabaseInsertQuote(
  quote: Quote,
  followUps: QuoteFollowUp[],
): Promise<Quote> {
  const client = getClient();
  const { data, error } = await client
    .from("quotes")
    .insert(quote)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (followUps.length > 0) {
    const { error: fuError } = await client
      .from("quote_follow_ups")
      .insert(followUps);
    if (fuError) throw new Error(fuError.message);
  }

  return rowToQuote(data as QuoteRow);
}

export async function supabaseUpdateQuoteStatus(
  id: string,
  status: QuoteStatus,
  closedAt: string | null,
  updatedAt: string,
): Promise<Quote> {
  const { data, error } = await getClient()
    .from("quotes")
    .update({ status, closed_at: closedAt, updated_at: updatedAt })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToQuote(data as QuoteRow);
}

export async function supabaseListFollowUps(): Promise<QuoteFollowUp[]> {
  const { data, error } = await getClient()
    .from("quote_follow_ups")
    .select("*")
    .eq("tenant_id", getTenantId())
    .order("due_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as QuoteFollowUp[];
}

export async function supabaseGetFollowUp(
  id: string,
): Promise<QuoteFollowUp | null> {
  const { data, error } = await getClient()
    .from("quote_follow_ups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as QuoteFollowUp | null) ?? null;
}

export async function supabaseUpdateFollowUp(
  id: string,
  patch: Partial<QuoteFollowUp>,
): Promise<QuoteFollowUp> {
  const { data, error } = await getClient()
    .from("quote_follow_ups")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as QuoteFollowUp;
}

export async function supabaseCancelPendingFollowUps(
  quoteId: string,
  updatedAt: string,
): Promise<void> {
  const cancelled: FollowUpStatus = "cancelled";
  const { error } = await getClient()
    .from("quote_follow_ups")
    .update({ status: cancelled, updated_at: updatedAt })
    .eq("quote_id", quoteId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
}
