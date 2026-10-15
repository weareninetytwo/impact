/** Claude drafting for quote follow-ups (server-only). */
import Anthropic from "@anthropic-ai/sdk";
import type { DueFollowUp } from "@impact/shared";

const MODEL = "claude-opus-5-5";

const SYSTEM_PROMPT = `You write short follow-up emails for a branding and signage company that has sent a customer a quote.

Write like a real person at a local business: plain, warm, specific to the job, no hype, no fake urgency, no exclamation-mark enthusiasm. Keep the body under 90 words. Make it easy to reply in one line. Never invent facts that are not in the quote details (prices, dates, discounts, install slots). Sign off with the sender name exactly as given.

Each step has a different job:
- Step 1: confirm the quote arrived and offer to walk through it.
- Step 2: surface what might be holding it up (budget, timeline, landlord or permit approval) and offer options.
- Step 3: politely close the loop and ask whether to keep the quote open.`;

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

export function isClaudeDraftingConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.ANTHROPIC_AUTH_TOKEN?.trim(),
  );
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

function describeQuote(followUp: DueFollowUp, senderName: string): string {
  const { quote } = followUp;
  const lines = [
    `Follow-up step: ${followUp.step} of 3`,
    `Customer: ${quote.customer_name}`,
    quote.company_name && `Company: ${quote.company_name}`,
    quote.job_type && `Job: ${quote.job_type}`,
    quote.amount != null &&
      `Quote amount: $${Math.round(quote.amount).toLocaleString("en-US")}`,
    quote.description && `Quote details: ${quote.description}`,
    `Quote sent: ${new Date(quote.quote_sent_at).toDateString()}`,
    `Sender name: ${senderName}`,
    "",
    "Current draft (improve it, keep the same intent):",
    `Subject: ${followUp.subject}`,
    followUp.body,
  ];
  return lines.filter((line) => line !== null && line !== false).join("\n");
}

/** Ask Claude to redraft one follow-up email. Returns null on refusal. */
export async function draftFollowUpWithClaude(
  followUp: DueFollowUp,
  senderName: string,
): Promise<{ subject: string; body: string } | null> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: DRAFT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: describeQuote(followUp, senderName) }],
  });

  if (response.stop_reason === "refusal") return null;

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  const parsed = JSON.parse(text) as { subject?: unknown; body?: unknown };

  if (typeof parsed.subject !== "string" || typeof parsed.body !== "string") {
    throw new Error("Claude returned an unexpected draft shape");
  }
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}
