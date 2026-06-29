import { promises as fs } from "fs";
import path from "path";
import type { ScoutRun, ScoutSource } from "@impact/shared";

const DEFAULT_FILENAME = "scout-data.json";

interface ScoutDataFile {
  sources: ScoutSource[];
  runs: ScoutRun[];
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
    const empty: ScoutDataFile = { sources: [], runs: [] };
    await fs.writeFile(filePath, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readScoutData(): Promise<ScoutDataFile> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as ScoutDataFile;
  return {
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
  };
}

export async function writeScoutData(data: ScoutDataFile): Promise<void> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
