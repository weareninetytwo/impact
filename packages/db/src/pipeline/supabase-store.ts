import type { PipelineArtifact, PipelineArtifactType } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

const PIPELINE_SOURCE = "impact-pipeline";

type KnowledgeRow = {
  id: string;
  tenant_id: string;
  title: string;
  type: string;
  source: string;
  tags: string[];
  summary: string | null;
  content_text: string;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

function artifactToRow(artifact: PipelineArtifact): KnowledgeRow {
  return {
    id: artifact.id,
    tenant_id: artifact.tenant_id,
    title: artifact.title,
    type: "other",
    source: PIPELINE_SOURCE,
    tags: [
      "impact-pipeline",
      artifact.artifact_type,
      artifact.opportunity_id ?? "global",
      artifact.status,
    ],
    summary: `${artifact.artifact_type} · ${artifact.status}`,
    content_text: JSON.stringify(artifact),
    file_name: null,
    file_path: null,
    mime_type: "application/json",
    chunk_count: 0,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  };
}

function rowToArtifact(row: KnowledgeRow): PipelineArtifact {
  const parsed = JSON.parse(row.content_text) as PipelineArtifact;
  return parsed;
}

async function listKnowledgePipelineRows(): Promise<KnowledgeRow[]> {
  const { data, error } = await getClient()
    .from("knowledge_items")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("source", PIPELINE_SOURCE)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as KnowledgeRow[]) ?? [];
}

export async function supabaseListPipelineArtifacts(
  artifactType?: PipelineArtifactType,
  opportunityId?: string,
): Promise<PipelineArtifact[]> {
  let rows = await listKnowledgePipelineRows();
  let artifacts = rows.map(rowToArtifact);

  if (artifactType) {
    artifacts = artifacts.filter((a) => a.artifact_type === artifactType);
  }
  if (opportunityId) {
    artifacts = artifacts.filter((a) => a.opportunity_id === opportunityId);
  }

  return artifacts.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function supabaseUpsertPipelineArtifact(
  artifact: PipelineArtifact,
): Promise<PipelineArtifact> {
  const row = artifactToRow(artifact);
  const { data, error } = await getClient()
    .from("knowledge_items")
    .upsert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToArtifact(data as KnowledgeRow);
}

export async function supabaseGetLatestAutomationRun(): Promise<PipelineArtifact | null> {
  const items = await supabaseListPipelineArtifacts("automation_run");
  return items[0] ?? null;
}
