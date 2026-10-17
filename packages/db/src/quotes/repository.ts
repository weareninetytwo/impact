import type {
  DueFollowUp,
  FollowUpDraftSource,
  Quote,
  QuoteFollowUp,
  QuoteFollowUpStats,
  QuoteInput,
  QuoteWithFollowUps,
} from "@impact/shared";
import { FOLLOW_UP_SCHEDULE_DAYS, getTenantId } from "@impact/shared";
import { buildFollowUpSequence } from "@impact/engines";
import { randomUUID } from "crypto";
import { isSupabasePersistenceEnabled } from "../client";
import { readQuoteData, writeQuoteData } from "./store";
import {
  supabaseCancelPendingFollowUps,
  supabaseFindQuoteByExternalRef,
  supabaseGetFollowUp,
  supabaseGetQuote,
  supabaseInsertQuote,
  supabaseListFollowUps,
  supabaseListQuotes,
  supabaseUpdateFollowUp,
  supabaseUpdateQuoteStatus,
} from "./supabase-store";

export interface QuoteImportResult {
  created: number;
  skipped: number;
  errors: { index: number; error: string }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

/** Name used to sign template follow-ups. */
export function getQuoteSenderName(): string {
  return process.env.IMPACT_QUOTE_SENDER_NAME?.trim() || "ninety two";
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function validateQuoteInput(input: QuoteInput): string | null {
  if (!input.customer_name?.trim()) return "customer_name is required";
  if (input.amount != null && (Number.isNaN(input.amount) || input.amount < 0)) {
    return "amount must be a positive number";
  }
  if (input.quote_sent_at && Number.isNaN(Date.parse(input.quote_sent_at))) {
    return "quote_sent_at must be an ISO date";
  }
  return null;
}

function buildQuoteRecords(input: QuoteInput): {
  quote: Quote;
  followUps: QuoteFollowUp[];
} {
  const ts = nowIso();
  const sentAt = input.quote_sent_at
    ? new Date(input.quote_sent_at)
    : new Date();

  const quote: Quote = {
    id: randomUUID(),
    tenant_id: getTenantId(),
    customer_name: input.customer_name.trim(),
    company_name: cleanText(input.company_name),
    contact_email: cleanText(input.contact_email),
    contact_phone: cleanText(input.contact_phone),
    job_type: cleanText(input.job_type),
    amount: input.amount ?? null,
    description: cleanText(input.description),
    quote_sent_at: sentAt.toISOString(),
    status: "open",
    closed_at: null,
    source: input.source ?? "manual",
    external_ref: cleanText(input.external_ref),
    created_at: ts,
    updated_at: ts,
  };

  const followUps: QuoteFollowUp[] = buildFollowUpSequence(
    input,
    sentAt,
    getQuoteSenderName(),
  ).map((draft) => ({
    id: randomUUID(),
    tenant_id: getTenantId(),
    quote_id: quote.id,
    step: draft.step,
    due_at: draft.due_at,
    subject: draft.subject,
    body: draft.body,
    status: "pending",
    drafted_by: "template",
    sent_at: null,
    created_at: ts,
    updated_at: ts,
  }));

  return { quote, followUps };
}

async function loadAll(): Promise<{
  quotes: Quote[];
  followUps: QuoteFollowUp[];
}> {
  if (isSupabasePersistenceEnabled()) {
    const [quotes, followUps] = await Promise.all([
      supabaseListQuotes(),
      supabaseListFollowUps(),
    ]);
    return { quotes, followUps };
  }
  const data = await readQuoteData();
  return { quotes: data.quotes, followUps: data.follow_ups };
}

export async function listQuotes(): Promise<QuoteWithFollowUps[]> {
  const { quotes, followUps } = await loadAll();
  return quotes
    .map((quote) => ({
      ...quote,
      follow_ups: followUps
        .filter((f) => f.quote_id === quote.id)
        .sort((a, b) => a.step - b.step),
    }))
    .sort(
      (a, b) =>
        new Date(b.quote_sent_at).getTime() -
        new Date(a.quote_sent_at).getTime(),
    );
}

export async function createQuote(
  input: QuoteInput,
): Promise<{ quote: Quote; created: boolean }> {
  const invalid = validateQuoteInput(input);
  if (invalid) throw new Error(invalid);

  const externalRef = cleanText(input.external_ref);
  const { quote, followUps } = buildQuoteRecords(input);

  if (isSupabasePersistenceEnabled()) {
    if (externalRef) {
      const existing = await supabaseFindQuoteByExternalRef(externalRef);
      if (existing) return { quote: existing, created: false };
    }
    return { quote: await supabaseInsertQuote(quote, followUps), created: true };
  }

  const data = await readQuoteData();
  if (externalRef) {
    const existing = data.quotes.find((q) => q.external_ref === externalRef);
    if (existing) return { quote: existing, created: false };
  }
  data.quotes.push(quote);
  data.follow_ups.push(...followUps);
  await writeQuoteData(data);
  return { quote, created: true };
}

export async function importQuotes(
  items: QuoteInput[],
): Promise<QuoteImportResult> {
  const result: QuoteImportResult = { created: 0, skipped: 0, errors: [] };
  for (const [index, item] of items.entries()) {
    try {
      const { created } = await createQuote({ ...item, source: "api" });
      if (created) result.created += 1;
      else result.skipped += 1;
    } catch (err) {
      result.errors.push({
        index,
        error: err instanceof Error ? err.message : "Import failed",
      });
    }
  }
  return result;
}

/**
 * Follow-ups ready to send: pending, due by the end of today, on an open quote.
 * Only the earliest pending step per quote is returned so steps never stack.
 */
export async function listDueFollowUps(now = new Date()): Promise<DueFollowUp[]> {
  const cutoff = new Date(now);
  cutoff.setHours(23, 59, 59, 999);

  const { quotes, followUps } = await loadAll();
  const openQuotes = new Map(
    quotes.filter((q) => q.status === "open").map((q) => [q.id, q]),
  );

  const earliestPending = new Map<string, QuoteFollowUp>();
  for (const followUp of followUps) {
    if (followUp.status !== "pending" || !openQuotes.has(followUp.quote_id)) {
      continue;
    }
    const current = earliestPending.get(followUp.quote_id);
    if (!current || followUp.step < current.step) {
      earliestPending.set(followUp.quote_id, followUp);
    }
  }

  return [...earliestPending.values()]
    .filter((f) => new Date(f.due_at).getTime() <= cutoff.getTime())
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .map((f) => ({ ...f, quote: openQuotes.get(f.quote_id)! }));
}

export async function getFollowUpWithQuote(
  id: string,
): Promise<DueFollowUp | null> {
  if (isSupabasePersistenceEnabled()) {
    const followUp = await supabaseGetFollowUp(id);
    if (!followUp) return null;
    const quote = await supabaseGetQuote(followUp.quote_id);
    return quote ? { ...followUp, quote } : null;
  }
  const data = await readQuoteData();
  const followUp = data.follow_ups.find((f) => f.id === id);
  if (!followUp) return null;
  const quote = data.quotes.find((q) => q.id === followUp.quote_id);
  return quote ? { ...followUp, quote } : null;
}

async function patchFollowUp(
  id: string,
  patch: Partial<QuoteFollowUp>,
): Promise<QuoteFollowUp> {
  const withTimestamp = { ...patch, updated_at: nowIso() };
  if (isSupabasePersistenceEnabled()) {
    return supabaseUpdateFollowUp(id, withTimestamp);
  }
  const data = await readQuoteData();
  const idx = data.follow_ups.findIndex((f) => f.id === id);
  if (idx < 0) throw new Error("Follow-up not found");
  data.follow_ups[idx] = { ...data.follow_ups[idx], ...withTimestamp };
  await writeQuoteData(data);
  return data.follow_ups[idx];
}

export async function updateFollowUpDraft(
  id: string,
  draft: { subject: string; body: string; drafted_by?: FollowUpDraftSource },
): Promise<QuoteFollowUp> {
  const patch: Partial<QuoteFollowUp> = {
    subject: draft.subject,
    body: draft.body,
  };
  if (draft.drafted_by) patch.drafted_by = draft.drafted_by;
  return patchFollowUp(id, patch);
}

/**
 * Mark a follow-up sent. If it went out late, push the quote's later steps
 * back so they keep their spacing from the actual send date instead of
 * landing the same day.
 */
export async function markFollowUpSent(id: string): Promise<QuoteFollowUp> {
  const sentAt = new Date();
  const sent = await patchFollowUp(id, {
    status: "sent",
    sent_at: sentAt.toISOString(),
  });

  const { followUps } = await loadAll();
  const sentOffset = FOLLOW_UP_SCHEDULE_DAYS[sent.step - 1] ?? 0;
  for (const later of followUps) {
    if (
      later.quote_id !== sent.quote_id ||
      later.status !== "pending" ||
      later.step <= sent.step
    ) {
      continue;
    }
    const gapDays = (FOLLOW_UP_SCHEDULE_DAYS[later.step - 1] ?? 0) - sentOffset;
    const earliest = sentAt.getTime() + gapDays * DAY_MS;
    if (new Date(later.due_at).getTime() < earliest) {
      await patchFollowUp(later.id, { due_at: new Date(earliest).toISOString() });
    }
  }

  return sent;
}

export async function skipFollowUp(id: string): Promise<QuoteFollowUp> {
  return patchFollowUp(id, { status: "skipped" });
}

/** Close a quote as won or lost and cancel its remaining follow-ups. */
export async function closeQuote(
  id: string,
  status: "won" | "lost",
): Promise<Quote> {
  const ts = nowIso();
  if (isSupabasePersistenceEnabled()) {
    const quote = await supabaseUpdateQuoteStatus(id, status, ts, ts);
    await supabaseCancelPendingFollowUps(id, ts);
    return quote;
  }

  const data = await readQuoteData();
  const idx = data.quotes.findIndex((q) => q.id === id);
  if (idx < 0) throw new Error("Quote not found");
  data.quotes[idx] = {
    ...data.quotes[idx],
    status,
    closed_at: ts,
    updated_at: ts,
  };
  data.follow_ups = data.follow_ups.map((f) =>
    f.quote_id === id && f.status === "pending"
      ? { ...f, status: "cancelled", updated_at: ts }
      : f,
  );
  await writeQuoteData(data);
  return data.quotes[idx];
}

function winRate(won: number, closed: number): number | null {
  return closed > 0 ? won / closed : null;
}

export async function getQuoteFollowUpStats(): Promise<QuoteFollowUpStats> {
  const [quotes, due] = await Promise.all([listQuotes(), listDueFollowUps()]);

  const open = quotes.filter((q) => q.status === "open");
  const won = quotes.filter((q) => q.status === "won");
  const closed = quotes.filter((q) => q.status !== "open");
  const followedUp = closed.filter((q) =>
    q.follow_ups.some((f) => f.status === "sent"),
  );
  const notFollowedUp = closed.filter(
    (q) => !q.follow_ups.some((f) => f.status === "sent"),
  );

  return {
    open_count: open.length,
    open_value: open.reduce((sum, q) => sum + (q.amount ?? 0), 0),
    due_count: due.length,
    sent_count: quotes.reduce(
      (sum, q) => sum + q.follow_ups.filter((f) => f.status === "sent").length,
      0,
    ),
    won_count: won.length,
    lost_count: closed.length - won.length,
    won_value: won.reduce((sum, q) => sum + (q.amount ?? 0), 0),
    win_rate_followed_up: winRate(
      followedUp.filter((q) => q.status === "won").length,
      followedUp.length,
    ),
    closed_followed_up: followedUp.length,
    win_rate_not_followed_up: winRate(
      notFollowedUp.filter((q) => q.status === "won").length,
      notFollowedUp.length,
    ),
    closed_not_followed_up: notFollowedUp.length,
  };
}
