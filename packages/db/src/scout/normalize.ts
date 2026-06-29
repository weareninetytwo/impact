import type { ScoutSource, SignalIngestItem } from "@impact/shared";
import type { RawScoutItem } from "./fetch-rss";

function inferSignalType(title: string, source: ScoutSource): string {
  const text = `${title} ${source.query ?? ""}`.toLowerCase();
  if (/\b(rfp|bid|solicitation|procurement|contract)\b/.test(text)) {
    return "rfp";
  }
  if (/\b(expansion|opens|new location|hiring|series [a-c])\b/.test(text)) {
    return "expansion";
  }
  if (/\b(website|redesign|rebrand|digital)\b/.test(text)) {
    return "digital";
  }
  return "signal";
}

function extractCompanyName(title: string): string {
  const separators = [" — ", " - ", " | ", ": "];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx > 2) {
      return title.slice(0, idx).trim();
    }
  }

  const words = title.split(/\s+/).slice(0, 4);
  return words.join(" ").trim() || "Unknown org";
}

export function normalizeScoutItems(
  rawItems: RawScoutItem[],
  source: ScoutSource,
): SignalIngestItem[] {
  return rawItems.map((item) => ({
    company_name: extractCompanyName(item.title),
    opportunity_title: item.title.slice(0, 240),
    signal_type: inferSignalType(item.title, source),
    signal_summary: item.description?.slice(0, 500),
    source_name: source.name,
    source_url: item.link,
    raw_text: item.description ?? item.title,
    fit_notes: `Scout: ${source.name} (${source.source_type})`,
  }));
}

export function buildGoogleNewsRssUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}
