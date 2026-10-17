# 0009 — Observability and LLM cost controls

**Status:** Proposed

## Context
Anthropic calls are made directly where needed (`claude-opus-5-5` with server-side fallbacks). There is no per-tenant cap, no central log, and errors are visible only in Vercel logs.

## Options
1. Leave as is. A bug or abusive tenant can run up cost.
2. **One LLM gateway** in the engines or db layer: every call passes tenant, purpose, model and max tokens; it enforces a per-tenant monthly budget, logs usage (ADR 0008) and falls back on failure.
3. A third-party LLM proxy (Helicone, LiteLLM). Faster, adds a vendor in the data path.

## Decision
Option 2. Hard budget per tenant with a graceful degrade to templates (the quote feature already works without Claude). Log tenant, purpose, tokens, latency and error class, never prompt contents containing personal data by default. Add error reporting (Sentry or Vercel's) with the tenant id as a tag, and an alert on budget exhaustion and repeated job failures.

## Consequences
- Choose the cheapest adequate model per purpose; do not default every call to the largest.
- Prompt injection from scraped web text is a real risk: scraped content is data, never instructions, and drafts stay human-approved.
