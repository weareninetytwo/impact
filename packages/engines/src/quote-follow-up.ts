import { FOLLOW_UP_SCHEDULE_DAYS } from "@impact/shared";
import type { QuoteInput } from "@impact/shared";

export interface FollowUpDraft {
  step: number;
  due_at: string;
  subject: string;
  body: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function firstName(name: string): string {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

function describeJob(quote: QuoteInput): string {
  return quote.job_type?.trim() || "signage";
}

function formatAmount(amount: number | null | undefined): string | null {
  if (amount == null || Number.isNaN(amount)) return null;
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

/**
 * Template copy for each follow-up step. Deterministic so the sequence works
 * without an AI provider; Claude can redraft individual messages on demand.
 */
export function buildFollowUpTemplate(
  quote: QuoteInput,
  step: number,
  senderName: string,
): { subject: string; body: string } {
  const name = firstName(quote.customer_name);
  const job = describeJob(quote);
  const amount = formatAmount(quote.amount);
  const quoteRef = amount ? `the ${job} quote (${amount})` : `the ${job} quote`;

  switch (step) {
    case 1:
      return {
        subject: `Your ${job} quote`,
        body: [
          `Hi ${name},`,
          "",
          `Just checking that ${quoteRef} came through okay. Happy to walk through any line items, materials or install details — a quick call or a reply here works.`,
          "",
          "Thanks,",
          senderName,
        ].join("\n"),
      };
    case 2:
      return {
        subject: `Quick question on your ${job} quote`,
        body: [
          `Hi ${name},`,
          "",
          `Following up on ${quoteRef}. If anything is holding it up — budget, timeline, landlord or permit approval — let me know and I can adjust the scope or give you a couple of options.`,
          "",
          "Thanks,",
          senderName,
        ].join("\n"),
      };
    default:
      return {
        subject: `Should I keep your ${job} quote open?`,
        body: [
          `Hi ${name},`,
          "",
          `I haven't heard back on ${quoteRef}, so I'll close it out on my end unless you'd like me to keep it open. A one-word reply is fine — and if the timing just isn't right, I'm happy to check back later.`,
          "",
          "Thanks,",
          senderName,
        ].join("\n"),
      };
  }
}

/** Build the full follow-up sequence for a newly logged quote. */
export function buildFollowUpSequence(
  quote: QuoteInput,
  quoteSentAt: Date,
  senderName: string,
): FollowUpDraft[] {
  return FOLLOW_UP_SCHEDULE_DAYS.map((days, index) => {
    const step = index + 1;
    const { subject, body } = buildFollowUpTemplate(quote, step, senderName);
    return {
      step,
      due_at: new Date(quoteSentAt.getTime() + days * DAY_MS).toISOString(),
      subject,
      body,
    };
  });
}
