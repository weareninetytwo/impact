export type PipelineArtifactType =
  | "company"
  | "contact"
  | "research"
  | "qualification"
  | "closer_brief"
  | "nurture"
  | "proposal"
  | "task"
  | "automation_run";

export interface PipelineArtifact {
  id: string;
  tenant_id: string;
  opportunity_id: string | null;
  artifact_type: PipelineArtifactType;
  title: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AutomationRunSummary {
  started_at: string;
  finished_at: string;
  scout_sources_run: number;
  imports_approved: number;
  imports_skipped: number;
  opportunities_processed: number;
  research_generated: number;
  qualified: number;
  briefs_generated: number;
  nurture_enrolled: number;
  proposals_generated: number;
  tasks_created: number;
  outreach_drafts_prepared: number;
  briefing: string;
  errors: string[];
}

export interface ResearchArtifact {
  company_summary: string;
  pain_points: string[];
  recommended_first_fix: string;
  outreach_angle: string;
}

export interface QualificationArtifact {
  qualified: boolean;
  grade: string;
  summary: string;
  discovery_questions: string[];
  disqualify_reasons: string[];
}

export interface CloserBriefArtifact {
  company_summary: string;
  signal_summary: string;
  why_now: string;
  project_type: string;
  suggested_offer: string;
  proposal_angle: string;
  discovery_questions: string[];
  objections_to_expect: string[];
}

export interface ProposalArtifact {
  title: string;
  content: string;
  estimated_value: number | null;
}

export interface NurtureArtifact {
  sequence_name: string;
  current_step: number;
  total_steps: number;
  next_touch: string;
  status: "active" | "paused" | "completed";
}

export interface TaskArtifact {
  title: string;
  task_type: string;
  due_at: string | null;
  priority: "high" | "medium" | "low";
  status: "open" | "done";
}
