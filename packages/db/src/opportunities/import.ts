import type { OpportunityInput, SignalType } from "@impact/shared";
import { SIGNAL_TYPES } from "@impact/shared";

const SIGNAL_VALUES = new Set(SIGNAL_TYPES.map((s) => s.value));

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseNumber(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseSignalType(raw: string | undefined): SignalType {
  const v = raw?.trim().toLowerCase().replace(/\s+/g, "_") ?? "other";
  const aliases: Record<string, SignalType> = {
    rfp: "rfp",
    apollo: "apollo",
    news: "news",
    press: "news",
    expansion: "expansion",
    website: "website_redesign",
    website_redesign: "website_redesign",
    redesign: "website_redesign",
    signage: "signage",
    partner: "agency_partner",
    agency_partner: "agency_partner",
    hiring: "hiring",
    funding: "funding",
  };
  const mapped = aliases[v] ?? v;
  return SIGNAL_VALUES.has(mapped as SignalType)
    ? (mapped as SignalType)
    : "other";
}

function rowToInput(
  headers: string[],
  values: string[],
): OpportunityInput | null {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    row[h] = values[i] ?? "";
  });

  const company_name =
    row.company_name || row.company || row.organization || "";
  const title = row.title || row.opportunity || row.project || "";

  if (!company_name || !title) return null;

  return {
    company_name,
    company_website: row.company_website || row.website || row.domain || null,
    title,
    signal_type: parseSignalType(row.signal_type || row.type || row.source_type),
    source: row.source || "csv_import",
    source_url: row.source_url || row.url || null,
    signal_summary:
      row.signal_summary || row.summary || row.description || null,
    deadline: row.deadline || row.due_date || null,
    estimated_value: parseNumber(row.estimated_value || row.value || row.budget),
    notes: row.notes || null,
  };
}

export function parseCsvOpportunities(csv: string): OpportunityInput[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const inputs: OpportunityInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const input = rowToInput(headers, values);
    if (input) inputs.push(input);
  }

  return inputs;
}

/** Parse pasted blocks separated by blank lines or CSV */
export function parsePasteOpportunities(text: string): OpportunityInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.includes(",") && trimmed.split("\n")[0]?.includes(",")) {
    return parseCsvOpportunities(trimmed);
  }

  const blocks = trimmed.split(/\n\s*\n/);
  const inputs: OpportunityInput[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const record: Record<string, string> = {};

    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon > 0) {
        const key = normalizeHeader(line.slice(0, colon));
        record[key] = line.slice(colon + 1).trim();
      } else if (!record.title) {
        record.title = line;
      } else if (!record.company_name) {
        record.company_name = line;
      } else {
        record.notes = [record.notes, line].filter(Boolean).join("\n");
      }
    }

    const input = rowToInput(Object.keys(record), Object.values(record));
    if (input) {
      input.source = input.source || "paste_import";
      inputs.push(input);
    }
  }

  return inputs;
}
