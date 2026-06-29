import { promises as fs } from "fs";
import path from "path";
import type { SignalImport } from "@impact/shared";

const DEFAULT_FILENAME = "signal-imports.json";

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
    await fs.writeFile(filePath, "[]", "utf-8");
  }
}

export async function readSignalImports(): Promise<SignalImport[]> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as SignalImport[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function writeSignalImports(
  records: SignalImport[],
): Promise<void> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");
}
