import { promises as fs } from "fs";
import path from "path";
import type { Quote, QuoteFollowUp } from "@impact/shared";

const DEFAULT_FILENAME = "quote-follow-ups.json";

export interface QuoteDataFile {
  quotes: Quote[];
  follow_ups: QuoteFollowUp[];
}

function resolveDataPath(): string {
  const override = process.env.IMPACT_DATA_DIR;
  const base = override ?? path.join(process.cwd(), "data");
  return path.join(base, DEFAULT_FILENAME);
}

async function ensureFile(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const empty: QuoteDataFile = { quotes: [], follow_ups: [] };
    await fs.writeFile(filePath, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readQuoteData(): Promise<QuoteDataFile> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as QuoteDataFile;
  return {
    quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
    follow_ups: Array.isArray(parsed.follow_ups) ? parsed.follow_ups : [],
  };
}

export async function writeQuoteData(data: QuoteDataFile): Promise<void> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
