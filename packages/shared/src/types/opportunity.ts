export type LeadGrade = "A" | "B" | "C" | "D";

export type OpportunityStage =
  | "new"
  | "reviewed"
  | "contact_needed"
  | "ready_for_outreach"
  | "nurturing"
  | "call_booked"
  | "proposal"
  | "won"
  | "lost"
  | "skip";

export type SignalType =
  | "rfp"
  | "apollo"
  | "news"
  | "expansion"
  | "website_redesign"
  | "signage"
  | "agency_partner"
  | "hiring"
  | "funding"
  | "other";

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  "new",
  "reviewed",
  "contact_needed",
  "ready_for_outreach",
  "nurturing",
  "call_booked",
  "proposal",
  "won",
  "lost",
  "skip",
];

export const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: "rfp", label: "RFP / Public bid" },
  { value: "apollo", label: "Apollo / Prospecting" },
  { value: "news", label: "News / Press" },
  { value: "expansion", label: "Expansion" },
  { value: "website_redesign", label: "Website redesign" },
  { value: "signage", label: "Signage / Environmental" },
  { value: "agency_partner", label: "Agency partner lead" },
  { value: "hiring", label: "Hiring surge" },
  { value: "funding", label: "Funding round" },
  { value: "other", label: "Other" },
];

export const DEFAULT_TENANT_ID = "00000000-0000-4000-8000-000000000001";

export interface Opportunity {
  id: string;
  tenant_id: string;
  company_name: string;
  company_website: string | null;
  title: string;
  stage: OpportunityStage;
  lead_grade: LeadGrade;
  signal_type: SignalType;
  source: string;
  source_url: string | null;
  signal_summary: string | null;
  deadline: string | null;
  estimated_value: number | null;
  fit_score: number;
  urgency_score: number;
  value_score: number;
  confidence_score: number;
  total_score: number;
  next_action: string;
  recommended_action: string;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityInput {
  company_name: string;
  company_website?: string | null;
  title: string;
  signal_type: SignalType;
  source: string;
  source_url?: string | null;
  signal_summary?: string | null;
  deadline?: string | null;
  estimated_value?: number | null;
  notes?: string | null;
  next_action?: string;
  stage?: OpportunityStage;
}

export type LeadScope = "mine" | "team";

export interface ListOpportunitiesOptions {
  tenantId?: string;
  scope?: LeadScope;
  userId?: string | null;
}

export interface DashboardStats {
  total: number;
  new_count: number;
  a_grade: number;
  ready_for_outreach: number;
  needs_contact: number;
  nurturing_count: number;
  in_proposal: number;
  open_estimated_pipeline: number;
}
