import { promises as fs } from "fs";
import path from "path";
import type { Opportunity } from "@impact/shared";

const DEFAULT_FILENAME = "opportunities.json";

function resolveDataPath(): string {
  const override = process.env.IMPACT_DATA_DIR;
  const base = override ?? path.join(process.cwd(), "data");
  return path.join(base, DEFAULT_FILENAME);
}

async function ensureDataFile(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
}

export async function readOpportunities(): Promise<Opportunity[]> {
  const filePath = resolveDataPath();
  await ensureDataFile(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Opportunity[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function writeOpportunities(
  opportunities: Opportunity[],
): Promise<void> {
  const filePath = resolveDataPath();
  await ensureDataFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(opportunities, null, 2), "utf-8");
}

export function getDataFilePath(): string {
  return resolveDataPath();
}
