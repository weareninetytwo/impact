"use server";

import {
  getLatestAutomationRun,
  getLatestArtifactForOpportunity,
  listActiveNurture,
  listCompaniesFromArtifacts,
  listOpenTasks,
  listOpportunities,
  listPipelineArtifacts,
  listProposals,
  markTaskDone,
  runFullPipeline,
  updateProposalStatus,
} from "@impact/db";
import type {
  AutomationRunSummary,
  CloserBriefArtifact,
  PipelineArtifact,
  ProposalArtifact,
  QualificationArtifact,
  ResearchArtifact,
} from "@impact/shared";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/session";

export async function fetchLatestAutomationRun(): Promise<PipelineArtifact | null> {
  return getLatestAutomationRun();
}

export async function fetchAutomationSummary(): Promise<AutomationRunSummary | null> {
  const run = await getLatestAutomationRun();
  if (!run) return null;
  return run.payload as unknown as AutomationRunSummary;
}

export async function runAutomationAction(): Promise<
  { ok: true; summary: AutomationRunSummary } | { error: string }
> {
  try {
    const session = await getAuthSession();
    const senderName = session?.fullName?.split(/\s+/)[0] ?? "Gino";
    const summary = await runFullPipeline({ senderName });
    revalidateAll();
    return { ok: true, summary };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Automation failed",
    };
  }
}

function revalidateAll() {
  const paths = [
    "/dashboard",
    "/automation",
    "/qualification",
    "/nurture",
    "/outreach",
    "/proposals",
    "/tasks",
    "/companies",
    "/contacts",
    "/analytics",
    "/opportunities",
  ];
  for (const path of paths) revalidatePath(path);
}

export interface OpportunityRef {
  id: string;
  company_name: string;
  title: string;
  lead_grade: string;
}

export async function fetchOpportunityMap(): Promise<Map<string, OpportunityRef>> {
  const opps = await listOpportunities();
  return new Map(
    opps.map((o) => [
      o.id,
      {
        id: o.id,
        company_name: o.company_name,
        title: o.title,
        lead_grade: o.lead_grade,
      },
    ]),
  );
}

export async function fetchQualifiedLeads() {
  const opps = await listOpportunities();
  const items = [];
  for (const opp of opps) {
    const artifact = await getLatestArtifactForOpportunity(
      opp.id,
      "qualification",
    );
    if (!artifact) continue;
    const qual = artifact.payload as unknown as QualificationArtifact;
    items.push({ opportunity: opp, qualification: qual, artifact });
  }
  return items.filter((i) => i.qualification.qualified);
}

export async function fetchResearchItems() {
  return listPipelineArtifacts("research");
}

export async function fetchCloserBriefs() {
  return listPipelineArtifacts("closer_brief");
}

export async function fetchNurtureEnrollments() {
  return listActiveNurture();
}

export async function fetchProposalArtifacts() {
  return listProposals();
}

export async function fetchTaskArtifacts() {
  return listOpenTasks();
}

export async function fetchCompanyArtifacts() {
  return listCompaniesFromArtifacts();
}

export async function fetchContactArtifacts() {
  return listPipelineArtifacts("contact");
}

export async function markTaskDoneAction(taskId: string) {
  await markTaskDone(taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateProposalStatusAction(id: string, status: string) {
  await updateProposalStatus(id, status);
  revalidatePath("/proposals");
}

export type { ResearchArtifact, CloserBriefArtifact, ProposalArtifact };
