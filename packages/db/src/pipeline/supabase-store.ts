import type { PipelineArtifact, PipelineArtifactType } from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

type Row = {
  id: string;
  tenant_id: string;
  opportunity_id: string | null;
  artifact_type: string;
  title: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function rowToArtifact(row: Row): PipelineArtifact {
  return {
    ...row,
    artifact_type: row.artifact_type as PipelineArtifactType,
  };
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function supabaseListPipelineArtifacts(
  artifactType?: PipelineArtifactType,
  opportunityId?: string,
): Promise<PipelineArtifact[]> {
  let query = getClient()
    .from("pipeline_artifacts")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("created_at", { ascending: false });

  if (artifactType) query = query.eq("artifact_type", artifactType);
  if (opportunityId) query = query.eq("opportunity_id", opportunityId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToArtifact);
}

export async function supabaseUpsertPipelineArtifact(
  artifact: PipelineArtifact,
): Promise<PipelineArtifact> {
  const row = {
    id: artifact.id,
    tenant_id: artifact.tenant_id,
    opportunity_id: artifact.opportunity_id,
    artifact_type: artifact.artifact_type,
    title: artifact.title,
    status: artifact.status,
    payload: artifact.payload,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  };

  const { data, error } = await getClient()
    .from("pipeline_artifacts")
    .upsert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToArtifact(data as Row);
}

export async function supabaseDeletePipelineArtifactsForOpportunity(
  opportunityId: string,
  artifactType: PipelineArtifactType,
): Promise<void> {
  const { error } = await getClient()
    .from("pipeline_artifacts")
    .delete()
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("opportunity_id", opportunityId)
    .eq("artifact_type", artifactType);

  if (error) throw new Error(error.message);
}

export async function supabaseGetLatestAutomationRun(): Promise<PipelineArtifact | null> {
  const { data, error } = await getClient()
    .from("pipeline_artifacts")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("artifact_type", "automation_run")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToArtifact(data as Row) : null;
}
