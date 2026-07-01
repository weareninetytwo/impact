import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { PipelineArtifact } from "@impact/shared";

function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function getDataDir(): string {
  if (isServerlessRuntime()) {
    return join("/tmp", "impact-pipeline");
  }
  return join(process.cwd(), ".data");
}

function getFilePath(): string {
  return join(getDataDir(), "pipeline-artifacts.json");
}

export function getPipelineDataFilePath(): string {
  return getFilePath();
}

async function ensureDir(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
}

export async function readPipelineStore(): Promise<PipelineArtifact[]> {
  const FILE_PATH = getFilePath();
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
  const FILE_PATH = getFilePath();
  await ensureDir();
  await writeFile(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export async function writePipelineStoreSafe(
  records: PipelineArtifact[],
): Promise<void> {
  await writePipelineStore(records);
}
