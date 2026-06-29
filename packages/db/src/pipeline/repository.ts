import { randomUUID } from "crypto";
import type {
  PipelineArtifact,
  PipelineArtifactType,
} from "@impact/shared";
import { DEFAULT_TENANT_ID } from "@impact/shared";
import { isSupabasePersistenceEnabled } from "../client";
import {
  readPipelineStore,
  writePipelineStore,
} from "./store";
import {
  supabaseGetLatestAutomationRun,
  supabaseListPipelineArtifacts,
  supabaseUpsertPipelineArtifact,
} from "./supabase-store";

function nowIso(): string {
  return new Date().toISOString();
}

function buildArtifact(
  input: Omit<PipelineArtifact, "id" | "tenant_id" | "created_at" | "updated_at"> & {
    id?: string;
  },
): PipelineArtifact {
  const ts = nowIso();
  return {
    id: input.id ?? randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    opportunity_id: input.opportunity_id,
    artifact_type: input.artifact_type,
    title: input.title,
    status: input.status,
    payload: input.payload,
    created_at: ts,
    updated_at: ts,
  };
}

async function listAll(
  artifactType?: PipelineArtifactType,
  opportunityId?: string,
): Promise<PipelineArtifact[]> {
  if (isSupabasePersistenceEnabled()) {
    try {
      return await supabaseListPipelineArtifacts(artifactType, opportunityId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("pipeline_artifacts")) throw err;
    }
  }

  let records = await readPipelineStore();
  if (artifactType) {
    records = records.filter((r) => r.artifact_type === artifactType);
  }
  if (opportunityId) {
    records = records.filter((r) => r.opportunity_id === opportunityId);
  }
  return records.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function save(record: PipelineArtifact): Promise<PipelineArtifact> {
  const updated = { ...record, updated_at: nowIso() };

  if (isSupabasePersistenceEnabled()) {
    try {
      return await supabaseUpsertPipelineArtifact(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("pipeline_artifacts")) throw err;
    }
  }

  const records = await readPipelineStore();
  const index = records.findIndex((r) => r.id === updated.id);
  if (index >= 0) records[index] = updated;
  else records.push(updated);
  await writePipelineStore(records);
  return updated;
}

export async function listPipelineArtifacts(
  artifactType?: PipelineArtifactType,
  opportunityId?: string,
): Promise<PipelineArtifact[]> {
  return listAll(artifactType, opportunityId);
}

export async function getLatestArtifactForOpportunity(
  opportunityId: string,
  artifactType: PipelineArtifactType,
): Promise<PipelineArtifact | null> {
  const items = await listAll(artifactType, opportunityId);
  return items[0] ?? null;
}

export async function createPipelineArtifact(
  opportunityId: string | null,
  artifactType: PipelineArtifactType,
  title: string,
  status: string,
  payload: Record<string, unknown>,
): Promise<PipelineArtifact> {
  return save(
    buildArtifact({
      opportunity_id: opportunityId,
      artifact_type: artifactType,
      title,
      status,
      payload,
    }),
  );
}

export async function upsertOpportunityArtifact(
  opportunityId: string,
  artifactType: PipelineArtifactType,
  title: string,
  status: string,
  payload: Record<string, unknown>,
): Promise<PipelineArtifact> {
  const existing = await getLatestArtifactForOpportunity(
    opportunityId,
    artifactType,
  );
  const record = buildArtifact({
    id: existing?.id,
    opportunity_id: opportunityId,
    artifact_type: artifactType,
    title,
    status,
    payload,
  });
  return save(record);
}

export async function saveAutomationRun(
  payload: Record<string, unknown>,
  title = "Automation run",
): Promise<PipelineArtifact> {
  return save(
    buildArtifact({
      opportunity_id: null,
      artifact_type: "automation_run",
      title,
      status:
        Array.isArray(payload.errors) && payload.errors.length > 0
          ? "partial"
          : "success",
      payload,
    }),
  );
}

export async function getLatestAutomationRun(): Promise<PipelineArtifact | null> {
  if (isSupabasePersistenceEnabled()) {
    try {
      return await supabaseGetLatestAutomationRun();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("pipeline_artifacts")) throw err;
    }
  }
  const runs = await listAll("automation_run");
  return runs[0] ?? null;
}

export async function listCompaniesFromArtifacts(): Promise<PipelineArtifact[]> {
  return listAll("company");
}

export async function listOpenTasks(): Promise<PipelineArtifact[]> {
  const tasks = await listAll("task");
  return tasks.filter((t) => t.status === "open");
}

export async function listActiveNurture(): Promise<PipelineArtifact[]> {
  const items = await listAll("nurture");
  return items.filter((t) => t.status === "active");
}

export async function listProposals(
  status?: string,
): Promise<PipelineArtifact[]> {
  const items = await listAll("proposal");
  if (!status) return items;
  return items.filter((p) => p.status === status);
}

export async function markTaskDone(taskId: string): Promise<void> {
  const records = await listAll("task");
  const task = records.find((t) => t.id === taskId);
  if (!task) return;
  await save({ ...task, status: "done", payload: { ...task.payload, done_at: nowIso() } });
}

export async function updateProposalStatus(
  proposalId: string,
  status: string,
): Promise<void> {
  const records = await listAll("proposal");
  const proposal = records.find((p) => p.id === proposalId);
  if (!proposal) return;
  await save({ ...proposal, status, payload: { ...proposal.payload, status } });
}
