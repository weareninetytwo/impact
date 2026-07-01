import type { ScoutSource, SignalIngestItem, SignalType } from "@impact/shared";
import { stripHtml } from "@impact/shared";
import type { RawScoutItem } from "./fetch-rss";

function cleanText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = stripHtml(text);
  return cleaned || undefined;
}

function inferSignalType(title: string, description?: string): SignalType {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (/\b(rfp|bid|solicitation|procurement|contract)\b/.test(text)) {
    return "rfp";
  }
  if (/\b(expansion|opens|new location|new office|opens office)\b/.test(text)) {
    return "expansion";
  }
  if (/\b(website|redesign|rebrand|digital marketing)\b/.test(text)) {
    return "website_redesign";
  }
  if (/\b(hiring|recruit|job opening|workforce)\b/.test(text)) {
    return "hiring";
  }
  return "news";
}

function splitHeadline(cleanTitle: string): { headline: string; publisher?: string } {
  const parts = cleanTitle.split(/\s+[-–—|]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      headline: parts[0],
      publisher: parts[parts.length - 1],
    };
  }
  return { headline: cleanTitle };
}

function extractCompanyName(cleanTitle: string): string {
  const { headline, publisher } = splitHeadline(cleanTitle);
  const orgMatch = headline.match(
    /^([A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+){0,3})/,
  );
  if (orgMatch?.[1]) return orgMatch[1].trim();
  if (publisher) return publisher;
  const words = headline.split(/\s+/).slice(0, 4);
  return words.join(" ").trim() || "Unknown org";
}

export function normalizeScoutItems(
  rawItems: RawScoutItem[],
  source: ScoutSource,
): SignalIngestItem[] {
  const items: SignalIngestItem[] = [];

  for (const item of rawItems) {
    const cleanTitle = cleanText(item.title);
    const cleanDescription = cleanText(item.description);
    if (!cleanTitle) continue;

    const { headline } = splitHeadline(cleanTitle);
    const signalType = inferSignalType(headline, cleanDescription);
    const proxyNote =
      source.source_type === "manual_query"
        ? " (Google News RSS proxy — not direct NYSCR/SAM feed)"
        : "";

    items.push({
      company_name: extractCompanyName(cleanTitle),
      opportunity_title: headline.slice(0, 240),
      signal_type: signalType,
      signal_summary: cleanDescription?.slice(0, 500),
      source_name: source.name,
      source_url: item.link,
      raw_text: cleanDescription ?? cleanTitle,
      fit_notes: `Scout: ${source.name}${proxyNote}`,
    });
  }

  return items;
}

export function buildGoogleNewsRssUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}
