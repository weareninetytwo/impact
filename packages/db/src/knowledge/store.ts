import { promises as fs } from "fs";
import path from "path";
import type {
  KnowledgeChunk,
  KnowledgeItem,
  OpportunityKnowledgeLink,
} from "@impact/shared";

const DEFAULT_FILENAME = "knowledge.json";

interface KnowledgeFileStore {
  items: KnowledgeItem[];
  chunks: KnowledgeChunk[];
  links: OpportunityKnowledgeLink[];
}

function emptyStore(): KnowledgeFileStore {
  return { items: [], chunks: [], links: [] };
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
    await fs.writeFile(
      filePath,
      JSON.stringify(emptyStore(), null, 2),
      "utf-8",
    );
  }
}

export async function readKnowledgeStore(): Promise<KnowledgeFileStore> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<KnowledgeFileStore>;
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
    links: Array.isArray(parsed.links) ? parsed.links : [],
  };
}

export async function writeKnowledgeStore(
  store: KnowledgeFileStore,
): Promise<void> {
  const filePath = resolveDataPath();
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function getKnowledgeDataFilePath(): string {
  return resolveDataPath();
}
