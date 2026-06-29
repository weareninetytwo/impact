import type { Opportunity, SignalType } from "@impact/shared";

export interface OutreachDraftInput {
  opportunity: Pick<
    Opportunity,
    | "company_name"
    | "title"
    | "signal_type"
    | "signal_summary"
    | "source_url"
    | "recommended_action"
  >;
  knowledgeSnippets?: string[];
  senderName?: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

const HOOK_BY_SIGNAL: Record<SignalType, string> = {
  rfp: "I saw the RFP opportunity and wanted to reach out before the deadline.",
  expansion:
    "Congrats on the expansion — scaling a brand across new locations is exactly where we help teams move fast without losing consistency.",
  website_redesign:
    "I noticed you're likely evaluating your digital presence — we help brands turn website projects into measurable growth, not just a pretty launch.",
  signage:
    "Environmental graphics and signage rollouts are a specialty for us — happy to share how we've kept multi-site programs on brand and on schedule.",
  funding:
    "Congrats on the recent momentum — post-funding is often when brand and digital need to level up quickly.",
  hiring:
    "Employer brand and recruiting creative is something we support when teams are scaling headcount.",
  agency_partner:
    "We're always open to strong white-label partnerships when capacity or specialty work comes up.",
  apollo: "I wanted to introduce ninety two and see if brand or digital support is on your radar.",
  news: "I came across recent news about your team and wanted to reach out while it's timely.",
  other: "I wanted to introduce ninety two and see if we might be a fit for an upcoming initiative.",
};

function firstNameFromCompany(company: string): string {
  const cleaned = company.replace(/\s+(Inc|LLC|Corp|Co)\.?$/i, "").trim();
  return cleaned.split(/\s+/)[0] || "there";
}

function signalContext(summary: string | null, title: string): string {
  const text = (summary ?? title).trim();
  if (!text) return "";
  const snippet = text.length > 160 ? `${text.slice(0, 157)}…` : text;
  return `\n\nFor context: ${snippet}`;
}

function knowledgeBlock(snippets: string[] | undefined): string {
  if (!snippets?.length) return "";
  const line = snippets[0].length > 200 ? `${snippets[0].slice(0, 197)}…` : snippets[0];
  return `\n\nWe recently helped a similar team with ${line}`;
}

export function buildOutreachDraft(input: OutreachDraftInput): OutreachDraft {
  const {
    opportunity,
    knowledgeSnippets,
    senderName = "Gino",
  } = input;

  const company = opportunity.company_name.trim();
  const hook =
    HOOK_BY_SIGNAL[opportunity.signal_type] ??
    HOOK_BY_SIGNAL.other;

  const subject = `${company} × ninety two — quick intro`;

  const body = `Hi ${firstNameFromCompany(company)} team,

${hook}${signalContext(opportunity.signal_summary, opportunity.title)}${knowledgeBlock(knowledgeSnippets)}

ninety two is a brand and digital studio — we partner with growth-stage teams on brand strategy, web, and campaign creative when speed and craft both matter.

Would a 15-minute call this week be useful to see if there's a fit? Happy to share relevant work and talk through your timeline.

Best,
${senderName}
ninety two
https://weareninetytwo.com`;

  return { subject, body };
}

export function buildGmailComposeUrl(
  draft: OutreachDraft,
  toEmail?: string,
): string {
  const params = new URLSearchParams();
  if (toEmail?.trim()) params.set("to", toEmail.trim());
  params.set("su", draft.subject);
  params.set("body", draft.body);
  return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
}
