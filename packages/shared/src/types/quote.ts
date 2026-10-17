export const QUOTE_STATUSES = ["open", "won", "lost"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_SOURCES = ["manual", "api"] as const;
export type QuoteSource = (typeof QUOTE_SOURCES)[number];

export const FOLLOW_UP_STATUSES = [
  "pending",
  "sent",
  "skipped",
  "cancelled",
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export type FollowUpDraftSource = "template" | "claude";

/** Days after the quote is sent that each follow-up comes due. */
export const FOLLOW_UP_SCHEDULE_DAYS = [2, 5, 10] as const;

export interface Quote {
  id: string;
  tenant_id: string;
  customer_name: string;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  job_type: string | null;
  amount: number | null;
  description: string | null;
  quote_sent_at: string;
  status: QuoteStatus;
  closed_at: string | null;
  source: QuoteSource;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteInput {
  customer_name: string;
  company_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  job_type?: string | null;
  amount?: number | null;
  description?: string | null;
  /** ISO date or datetime; defaults to now. */
  quote_sent_at?: string | null;
  source?: QuoteSource;
  external_ref?: string | null;
}

export interface QuoteFollowUp {
  id: string;
  tenant_id: string;
  quote_id: string;
  step: number;
  due_at: string;
  subject: string;
  body: string;
  status: FollowUpStatus;
  drafted_by: FollowUpDraftSource;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteWithFollowUps extends Quote {
  follow_ups: QuoteFollowUp[];
}

export interface DueFollowUp extends QuoteFollowUp {
  quote: Quote;
}

export interface QuoteFollowUpStats {
  open_count: number;
  open_value: number;
  due_count: number;
  sent_count: number;
  won_count: number;
  lost_count: number;
  won_value: number;
  /** Win rate on closed quotes that had at least one follow-up sent. */
  win_rate_followed_up: number | null;
  closed_followed_up: number;
  /** Win rate on closed quotes with no follow-up sent. */
  win_rate_not_followed_up: number | null;
  closed_not_followed_up: number;
}
