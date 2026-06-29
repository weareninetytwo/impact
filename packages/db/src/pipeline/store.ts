import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import type { PipelineArtifact } from "@impact/shared";

const DATA_DIR = join(process.cwd(), ".data");
const FILE_PATH = join(DATA_DIR, "pipeline-artifacts.json");

export function getPipelineDataFilePath(): string {
  return FILE_PATH;
}

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function readPipelineStore(): Promise<PipelineArtifact[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writePipelineStore(
  records: PipelineArtifact[],
): Promise<void> {
  await ensureDir();
  await writeFile(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export async function writePipelineStoreSafe(
  records: PipelineArtifact[],
): Promise<void> {
  await writePipelineStore(records);
}
