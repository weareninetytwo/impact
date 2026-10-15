import { importQuotes } from "@impact/db";
import type { QuoteInput } from "@impact/shared";
import { verifyIngestAuth } from "@/lib/automation/token-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 100;

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  // Quoting tools often send formatted strings like "$12,000"
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : Number.NaN;
}

function toQuoteInput(raw: unknown): QuoteInput {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    customer_name: optionalString(item.customer_name) ?? "",
    company_name: optionalString(item.company_name),
    contact_email: optionalString(item.contact_email),
    contact_phone: optionalString(item.contact_phone),
    job_type: optionalString(item.job_type),
    amount: optionalAmount(item.amount),
    description: optionalString(item.description),
    quote_sent_at: optionalString(item.quote_sent_at),
    external_ref: optionalString(item.external_ref),
  };
}

/**
 * Log sent quotes from a quoting tool or automation (Zapier, Make, n8n).
 * Each quote gets a day 2 / 5 / 10 follow-up sequence. `external_ref`
 * dedupes repeat deliveries.
 */
export async function POST(request: Request) {
  if (!verifyIngestAuth(request.headers.get("authorization"))) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer IMPACT_INGEST_SECRET required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Body must be { items: [...] } with at least one quote" },
      { status: 400 },
    );
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `At most ${MAX_ITEMS} quotes per request` },
      { status: 400 },
    );
  }

  try {
    const result = await importQuotes(items.map(toQuoteInput));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    );
  }
}
